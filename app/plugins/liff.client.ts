// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()

  // ---- 1) LIFF 初期化 ----
  try {
    if (!pub.liffId) {
      console.error('[LIFF] NUXT_PUBLIC_LIFF_ID が未設定です')
      return
    }
    await liff.init({ liffId: pub.liffId })
  } catch (e) {
    console.error('[LIFF] init 失敗。エンドポイントURL/LIFF ID/ネットワークを確認', e)
    return
  }

  // 参考ログ（今いるURLと、LIFF設定のエンドポイント一致チェックに役立つ）
  try {
    const env = (liff as any).getEnvironment?.()
    console.log('[LIFF] env:', env)
    console.log('[LIFF] href:', location.href)
  } catch {}

  // ---- 2) ログイン制御 ----
  const inClient = (liff as any).getEnvironment?.().isInClient ?? false

  // LIFF内（LINEアプリ内）では基本「自動ログイン」される。外部ブラウザのみ login() を呼ぶ
  if (!inClient && !liff.isLoggedIn()) {
    // ※ redirectUri は“今いるURL”に戻すのが一番安全
    const redirectUri = location.href
    console.log('[LIFF] 外部ブラウザ。ログインへ redirect:', redirectUri)
    liff.login({ redirectUri })
    return // ここで処理は中断（ログイン後に戻ってくる）
  }

  // ---- 3) IDトークンの取得とデコード ----
  const idToken = liff.getIDToken()
  if (!idToken) {
    console.warn('[LIFF] idToken が取得できませんでした。scope=openid / login 成否を確認')
    return
  }

  const decoded: any = liff.getDecodedIDToken?.()
  const aud = decoded?.aud // これが“検証に使うべきチャネルID”
  const sub = decoded?.sub
  console.log('[LIFF] decoded:', decoded)
  console.log('[LIFF] aud(=client_id):', aud, 'sub(userId):', sub)

  // ---- 4) サーバへ検証リクエスト ----
  try {
    const session = await $fetch('/api/line/session', {
      method: 'POST',
      body: {
        idToken,        // 必須
        clientId: aud,  // ← ここが重要（開発/本番で異なるチャネルIDに対応）
      },
    })
    console.log('[LIFF] /api/line/session OK:', session)
  } catch (e: any) {
    // サーバの statusMessage を見やすく表示
    const status = e?.response?.status || e?.status || 0
    const msg = e?.data || e?.statusMessage || e?.message
    console.error(`[LIFF] /api/line/session 失敗 (${status})`, msg)
  }
})
