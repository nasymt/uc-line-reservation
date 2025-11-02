// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()
  await liff.init({ liffId: pub.liffId }) // エンドポイントURL配下で実行必須

  // LINEアプリ内かどうか
  const inClient = liff.isInClient()

  // 外部ブラウザのときだけ login を呼ぶ（LIFF内では呼ばない）
  if (!inClient && !liff.isLoggedIn()) {
    const redirectUri = location.origin + location.pathname + location.search
    // ※ このURLを LINEログインチャネルの Callback URL にも登録する
    liff.login({ redirectUri })
    return
  }

  // ここまで来たら IDトークン取得できる想定（LIFF内 or 既ログイン）
  const idToken = liff.getIDToken()
  if (!idToken) {
    console.warn('[LIFF] idToken is null（URL/設定を再確認）')
    return
  }

  // 動作確認に便利：aud が LINEログインチャネルIDと一致するか
  const decoded = liff.getDecodedIDToken()
  console.log('[LIFF] aud=', decoded?.aud) // ← これが LINE_LOGIN_CHANNEL_ID と一致すること

  await $fetch('/api/line/session', { method: 'POST', body: { idToken } })
})
