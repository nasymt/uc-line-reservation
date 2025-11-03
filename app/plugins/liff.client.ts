// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const { public: pub } = useRuntimeConfig()
  const liffId = pub.liffId
  const LOG_ENDPOINT = 'https://bernard-unconnived-indomitably.ngrok-free.dev'

  async function logRemote(tag: string, data: any) {
    try {
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tag, data }),
      })
    } catch (e) {
      console.warn('[logRemote:init] failed', e)
    }
  }

  nuxtApp.hook('app:mounted', async () => {
    if (!liffId) {
      await logRemote('liff-init-missing-id', {
        ts: new Date().toISOString(),
        msg: 'runtimeConfig.public.liffId is empty',
      })
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

      // 初回にまだトークンが無かったらここで一回だけログイン飛ばす
      if (!idToken || !decoded) {
        await logRemote('liff-init-login', {
          ts: new Date().toISOString(),
          reason: 'no idToken at init',
        })
        await liff.login({ redirectUri: location.href })
      }
    } catch (e: any) {
      await logRemote('liff-init-error', {
        ts: new Date().toISOString(),
        message: e?.message || String(e),
      })
    }
  })
})
