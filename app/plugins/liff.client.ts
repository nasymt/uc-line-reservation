import liff from "@line/liff";

// export default defineNuxtPlugin(async () => {
//   const config = useRuntimeConfig();
//   await liff.init({ liffId: config.public.liffId as string });
//   if (!liff.isLoggedIn()) liff.login(); // LINE内なら即ログイン
// });

// plugins/liff.client.ts（抜粋）

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()
  await liff.init({ liffId: pub.liffId })

  if (!liff.isLoggedIn()) {
    await liff.login({ redirectUri: `${location.origin}/reserve` })
    return
  }

  const idToken = liff.getIDToken()
  if (!idToken) {
    console.warn('[LIFF] idToken is null. Did you set scope=openid & correct Endpoint domain?')
    return
  }

  await $fetch('/api/line/session', {
    method: 'POST',
    body: { idToken },           // ← 必ず POST で idToken を送る
  })
})
