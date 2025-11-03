// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const { public: pub } = useRuntimeConfig()
  const liffId = pub.liffId
  const LOG_ENDPOINT = 'https://bernard-unconnived-indomitably.ngrok-free.dev'

  const liffReady = useState<boolean>('__liff_ready__', () => false)

  async function logRemote(tag: string, data: any) {
    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tag, data }),
      })
    } catch (_) {
      // ログが死んでも本処理は止めない
    }
  }

  nuxtApp.hook('app:mounted', async () => {
    if (!liffId) {
      await logRemote('liff-init-error', {
        ts: new Date().toISOString(),
        message: 'liffId is empty in runtimeConfig',
        liffId,
      })
      liffReady.value = false
      return
    }

    try {
      await liff.init({ liffId })
      const idToken = liff.getIDToken?.()
      const decoded = liff.getDecodedIDToken?.()

      await logRemote('liff-init-success', {
        ts: new Date().toISOString(),
        liffId,
        hasIdToken: !!idToken,
        decoded,
      })

      // ここまで来たら「送信してOK」
      liffReady.value = true

      // もし初回でトークンなかったら、この場でログインに飛ばすこともできる
      if (!idToken || !decoded) {
        await logRemote('liff-init-login', {
          ts: new Date().toISOString(),
          reason: 'init success but no idToken',
          liffId,
        })
        await liff.login({ redirectUri: location.href })
      }
    } catch (e: any) {
      await logRemote('liff-init-error', {
        ts: new Date().toISOString(),
        message: e?.message || String(e),
        liffTried: liffId,            // ←ここをログするのが重要
        location: location.href,
      })
      liffReady.value = false
    }
  })
})
