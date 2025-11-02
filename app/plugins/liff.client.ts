// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()

  // 1) LIFF初期化
  await liff.init({ liffId: pub.liffId })

  // 2) 未ログインならログインへ
  if (!liff.isLoggedIn()) {
    // 存在するパスに。指定がなければ“今いるURL”に戻すのが一番安全
    const redirectUri = pub.liffRedirect || location.href
    await liff.login({ redirectUri: `${redirectUri}` })
    return
  }

  // 3) ログイン済み → IDトークンをサーバへ
  const idToken = liff.getIDToken()
  if (!idToken) {
    console.warn('[LIFF] idToken is null. scope=openid? endpoint/redirect 同一ドメイン?')
    return
  }

  try {
    await $fetch('/api/line/session', {
      method: 'POST',
      body: { idToken },
    })
  } catch (e) {
    console.error('[LIFF] /api/line/session failed', e)
  }
})
