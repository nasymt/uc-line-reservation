import liff from '@line/liff'

/** 条件成立まで待つ */
async function waitFor<T>(fn: () => T | null | undefined | false, ms = 8000, step = 120): Promise<T> {
  const t0 = Date.now()
  for (;;) {
    const v = fn()
    if (v) return v as T
    if (Date.now() - t0 > ms) throw new Error('waitFor: timeout')
    await new Promise(r => setTimeout(r, step))
  }
}

/** セッション用フラグ（無限ループ防止 TTL 付き） */
function guard(key: string, ttlMs: number) {
  return {
    recently() {
      const s = sessionStorage.getItem(key)
      if (!s) return false
      const ts = Number(s)
      return Number.isFinite(ts) && Date.now() - ts < ttlMs
    },
    ping() { sessionStorage.setItem(key, String(Date.now())) },
    clear() { sessionStorage.removeItem(key) }
  }
}

/** URL から code / state / liff.state を除去（古いパラメータの残骸を掃除） */
function cleanedCurrentUrl(): string {
  const url = new URL(location.href)
  ;['code','state','liff.state'].forEach(k => url.searchParams.delete(k))
  return url.toString()
}

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()

  const loginGuard   = guard('__liff_login_guard',   15_000)
  const reloginGuard = guard('__liff_relogin_guard', 60_000)
  const sessionOnce  = guard('__liff_session_once',   60_000)

  // 非表示タブでの競合を避ける
  if (document.visibilityState === 'hidden') {
    await new Promise<void>(resolve => {
      const onv = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onv)
          resolve()
        }
      }
      document.addEventListener('visibilitychange', onv)
    })
  }

  // 1) init（必ずエンドポイントURL配下で）
  try {
    await liff.init({ liffId: pub.liffId })
  } catch (e) {
    console.error('[LIFF] init failed', e)
    return
  }

  const inClient = liff.getEnvironment?.().isInClient ?? false

  // 2) ログイン往復で落ちないよう、現在のクエリを退避
  const qs = location.search.slice(1)
  if (qs) sessionStorage.setItem('__saved_qs', qs)

  // 3) 直前に戻ってきたか検知（余計な login を抑止）
  const sp = new URLSearchParams(location.search)
  const justBack = sp.has('liff.state') || sp.has('code') || sp.has('state')

  // 4) 外部ブラウザのみ login。直近login済み or justBack なら抑止
  if (!inClient && !liff.isLoggedIn()) {
    if (!loginGuard.recently() && !justBack) {
      loginGuard.ping()
      const redirectUri = cleanedCurrentUrl()
      liff.login({ redirectUri })
      return
    } else {
      console.warn('[LIFF] suppress login (recently or justBack)')
    }
  }

  // 5) idToken を待つ
  try {
    await waitFor(() => liff.getIDToken?.())
  } catch {
    console.warn('[LIFF] idToken timeout; skip session call')
    return
  }

  // 6) 新鮮チェック（残り <= 30s は再ログイン）。再ログイン前に **logout と URL掃除** を挟む
  const fresh = () => {
    const tok = liff.getIDToken()!
    const dec: any = liff.getDecodedIDToken?.()
    const now = Math.floor(Date.now() / 1000)
    const exp = dec?.exp ?? 0
    const remain = exp - now
    return { tok, dec, remain }
  }
  let { tok: idToken, dec: decoded, remain } = fresh()
  console.log('[LIFF] aud=', decoded?.aud, 'sub=', decoded?.sub, 'remain=', remain)

  if (remain <= 30) {
    if (!reloginGuard.recently()) {
      console.warn('[LIFF] token expiring/expired → force refresh (logout → login)')
      reloginGuard.ping()

      try { liff.logout() } catch {}                 // ← いったん完全に破棄
      const redirectUri = cleanedCurrentUrl()        // ← code/state を除去した URL に戻す
      location.replace(redirectUri)                  // ← URL をクリーンにしてから…
      // ここで一旦再ロードされる
      return
    } else {
      console.warn('[LIFF] relogin already attempted; do not loop')
      return
    }
  } else {
    reloginGuard.clear()
  }

  // 7) /api/line/session は 1 回だけ
  if (!sessionOnce.recently()) {
    sessionOnce.ping()
    try {
      // **小文字**の /api/line/session を厳守（Vercelはケース敏感）
      const resp = await fetch('/api/line/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),           // clientId はサーバで idToken から抽出
      })
      const data = await resp.json().catch(() => null)
      console.log('[LIFF] /api/line/session', resp.status, data)
    } catch (e) {
      console.error('[LIFF] session call failed', e)
    }
  }

  // 8) 往復で消えたクエリを復元（必要なら）
  if (!location.search && sessionStorage.getItem('__saved_qs')) {
    const url = new URL(location.href)
    const saved = new URLSearchParams(sessionStorage.getItem('__saved_qs')!)
    saved.forEach((v, k) => url.searchParams.set(k, v))
    sessionStorage.removeItem('__saved_qs')
    history.replaceState(null, '', url.toString())
  }
})
