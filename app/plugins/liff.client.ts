// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin((nuxtApp) => {
  // ① SSRでは絶対に動かさない
  if (!import.meta.client) return

  const { public: pub } = useRuntimeConfig()
  const liffId = pub.liffId  // nuxt.config.ts で NUXT_PUBLIC_LIFF_ID を入れてるやつ

  // ② LIFF IDが無ければ何もしない（本番で消し忘れてもここで止まる）
  if (!liffId) {
    console.warn('[LIFF] no liffId in runtimeConfig.public.liffId')
    return
  }

  // ③ 実行は mountedタイミングで。起動時500を防ぐため try/catch で囲む
  nuxtApp.hook('app:mounted', async () => {
    try {
      await liff.init({ liffId })
      // ここまで来たら「このLIFFでIDトークンが取れる状態か」を確認
      const idToken = liff.getIDToken?.()
      const decoded = liff.getDecodedIDToken?.()
      console.log('[LIFF] init ok', { hasIdToken: !!idToken, sub: decoded?.sub, aud: decoded?.aud })

      // 初回だけログインしておきたい場合はここでやる
      if (!idToken || !decoded) {
        await liff.login({ redirectUri: location.href })
      }
    } catch (e: any) {
      // ここで握っておくと 500 にならない
      console.error('[LIFF] init failed', e?.message || e)
      // ついでに画面に出したいなら window に残す
      ;(window as any).__LIFF_ERROR__ = e?.message || String(e)
    }
  })
})
