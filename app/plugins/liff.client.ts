// app/plugins/liff.client.ts
import liff from '@line/liff'

/** 条件が満たされるまで待つ */
async function waitFor<T>(fn: () => T | null | undefined | false, ms = 8000, step = 120): Promise<T> {
  const t0 = Date.now()
  for (;;) {
    const v = fn()
    if (v) return v as T
    if (Date.now() - t0 > ms) throw new Error('waitFor: timeout')
    await new Promise(r => setTimeout(r, step))
  }
}

/** ログイン多重発火を防ぐためのガード(同タブ内で有効) */
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

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()

  const loginGuard = guard('__liff_login_guard', 15_000)    // 15秒以内は再loginしない
  const sessionOnce = guard('__liff_session_called', 60_000) // 1分以内にsessionを1回だけ
  const reloginOnce = guard('__liff_relogin_once', 60_000)   // 期限切れ時の再loginは1回だけ

  // 0) タブが非表示なら見えるまで待つ（Safari復帰直後の競合対策）
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

  // 1) init（エンドポイントURL配下で）
  try {
    await liff.init({ liffId: pub.liffId })
  } catch (e) {
    console.error('[LIFF] init failed', e)
    return
  }

  const inClient = liff.isInClient() ?? false

  // 2) クエリ退避（往復で落ちる事故の保険）
  const qs = location.search.slice(1)
  if (qs) sessionStorage.setItem('__saved_qs', qs)

  // 3) 直前に LINE から戻ったっぽいか？（liff.state / code / state を検知）
  const sp = new URLSearchParams(location.search)
  const justCameBack = sp.has('liff.state') || sp.has('code') || sp.has('state')

  // 4) 外部ブラウザのみ login を呼ぶ
  if (!inClient && !liff.isLoggedIn()) {
    if (!loginGuard.recently() && !justCameBack) {
      // 直近にloginしておらず、今が“復帰直後”でもない → login
      loginGuard.ping()
      liff.login({ redirectUri: location.href })
      return
    } else {
      console.warn('[LIFF] suppress login to avoid loop (recently or justCameBack)')
    }
  }

  // 5) 復帰後：クエリが消えていたら復元
  if (!location.search && sessionStorage.getItem('__saved_qs')) {
    const url = new URL(location.href)
    const saved = new URLSearchParams(sessionStorage.getItem('__saved_qs')!)
    saved.forEach((v, k) => url.searchParams.set(k, v))
    sessionStorage.removeItem('__saved_qs')
    history.replaceState(null, '', url.toString())
  }

  // 6) IDトークン準備を待つ
  try {
    await waitFor(() => liff.getIDToken?.())
  } catch {
    console.warn('[LIFF] idToken timeout; do not force relogin to avoid loop')
    return
  }

  const getFresh = () => {
    const tok = liff.getIDToken()!
    const dec: any = liff.getDecodedIDToken?.()
    const now = Math.floor(Date.now() / 1000)
    const exp = dec?.exp ?? 0
    return { tok, dec, now, exp, remain: exp - now }
  }

  let { tok: idToken, dec: decoded, remain } = getFresh()
  console.log('[LIFF] aud=', decoded?.aud, 'sub=', decoded?.sub, 'remain=', remain)

  // 7) 期限切れ/直前 → 1回だけ再ログイン（無限ループ防止）
  if (remain <= 30 && !reloginOnce.recently()) {
    console.warn('[LIFF] token expiring/expired → re-login once')
    reloginOnce.ping()
    liff.login({ redirectUri: location.href })
    return
  }
  // ここに来た＝使えるトークンがある
  reloginOnce.clear()

  // 8) /api/line/session は 1回だけ
  if (!sessionOnce.recently()) {
    sessionOnce.ping()
    try {
      const resp = await fetch('/api/line/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const data = await resp.json().catch(() => null)
      console.log('[LIFF] /api/line/session', resp.status, data)

      // 失敗しても すぐ再login しない（guard が抑止）
      if (!resp.ok) {
        console.warn('[LIFF] session verify failed; guard prevents immediate relogin')
      }
    } catch (e) {
      console.error('[LIFF] session call failed', e)
    }
  }
})
