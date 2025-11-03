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

/** リダイレクト直後の二重実行/多重API叩きを防ぐフラグ */
function getOnceFlag(key: string) {
  return {
    get: () => sessionStorage.getItem(key) === '1',
    set: () => sessionStorage.setItem(key, '1'),
    clear: () => sessionStorage.removeItem(key),
  }
}

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()
  const onceSession = getOnceFlag('__liff_session_called')
  const onceRelogin  = getOnceFlag('__liff_relogin_once')

  // 0) 画面が非表示（visibility:hidden）中は何もしない → 表示になってから実行
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

  // 1) LIFF 初期化（エンドポイントURL配下で）
  try {
    await liff.init({ liffId: pub.liffId })
  } catch (e) {
    console.error('[LIFF] init failed', e)
    return
  }

  const inClient = (liff as any).getEnvironment?.()?.isInClient ?? false

  // 2) いまのURLのクエリを退避（ログイン往復で落ちるのを防ぐ保険）
  const qs = location.search.slice(1)
  if (qs) sessionStorage.setItem('__saved_qs', qs)

  // 3) 外部ブラウザのみ login（LIFF内は自動ログイン）
  if (!inClient && !liff.isLoggedIn()) {
    liff.login({ redirectUri: location.href })
    return
  }

  // 4) 復帰後：クエリが消えていたら復元（保険）
  if (!location.search && sessionStorage.getItem('__saved_qs')) {
    const url = new URL(location.href)
    const saved = new URLSearchParams(sessionStorage.getItem('__saved_qs')!)
    saved.forEach((v, k) => url.searchParams.set(k, v))
    sessionStorage.removeItem('__saved_qs')
    history.replaceState(null, '', url.toString())
  }

  // 5) IDトークン/decoded を“準備できるまで”待つ
  await waitFor(() => liff.getIDToken?.())
  const getFresh = () => {
    const tok = liff.getIDToken()!
    const dec: any = liff.getDecodedIDToken?.()
    const now = Math.floor(Date.now() / 1000)
    const exp = dec?.exp ?? 0
    return { tok, dec, now, exp, remain: exp - now }
  }
  let { tok: idToken, dec: decoded, remain } = getFresh()

  // 6) 期限が切れてる/近い → 1回だけ強制リログインして更新（無限ループ防止）
  if (remain <= 30 && !onceRelogin.get()) {
    console.warn('[LIFF] token expiring/expired → re-login once')
    onceRelogin.set()
    liff.login({ redirectUri: location.href })
    return
  }
  // リフレッシュ後の2周目でここに来たらフラグをクリア
  onceRelogin.clear()

  // 7) /api/line/session は**1回だけ**叩く（リダイレクト直後の多重呼び出しを防ぐ）
  if (!onceSession.get()) {
    onceSession.set()
    try {
      const resp = await fetch('/api/line/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      const data = await resp.json().catch(() => null)
      console.log('[LIFF] /api/line/session', resp.status, data)
      if (!resp.ok) {
        // 期限切れ等で落ちたら1回だけ再ログイン
        if (!onceRelogin.get()) {
          console.warn('[LIFF] session verify failed → re-login once')
          onceRelogin.set()
          liff.login({ redirectUri: location.href })
          return
        }
      }
    } catch (e) {
      console.error('[LIFF] session call failed', e)
    }
  }

  // 以降、あなたの通常初期化処理…
})
