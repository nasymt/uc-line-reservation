// app/plugins/liff.client.ts
import liff from '@line/liff'

/** 指定条件が満たされるまで待つユーティリティ */
async function waitFor<T>(fn: () => T | null | undefined | false, {
  timeoutMs = 8000,
  intervalMs = 120,
} = {}): Promise<T> {
  const t0 = Date.now()
  for (;;) {
    const v = fn()
    if (v) return v as T
    if (Date.now() - t0 > timeoutMs) throw new Error('waitFor: timeout')
    await new Promise(r => setTimeout(r, intervalMs))
  }
}

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()

  // 1) LIFF init
  try {
    await liff.init({ liffId: pub.liffId })
  } catch (e) {
    console.error('[LIFF] init failed', e)
    return
  }

  // 2) 外部ブラウザだけ login を呼ぶ（LIFF内は自動ログイン）
  const inClient = (liff as any).getEnvironment?.().isInClient ?? false

  // → ログイン往復でクエリを落とさない保険
  const qs = location.search.slice(1)
  if (qs) sessionStorage.setItem('recQS', qs)

  if (!inClient && !liff.isLoggedIn()) {
    liff.login({ redirectUri: location.href }) // ← クエリごと戻る
    return
  }

  // 3) 復帰後：recommended* が消えたら復元（保険）
  if (!location.search.includes('recommendedClass') &&
      !location.search.includes('recommendedCourse')) {
    const saved = sessionStorage.getItem('recQS')
    if (saved) {
      const url = new URL(location.href)
      const sp = new URLSearchParams(saved)
      sp.forEach((v, k) => url.searchParams.set(k, v))
      sessionStorage.removeItem('recQS')
      history.replaceState(null, '', url.toString())
    }
  }

  // 4) ★ ここが重要：idToken & aud が揃うまで待つ
  try {
    await waitFor(() => liff.getIDToken())
  } catch {
    console.warn('[LIFF] idToken not ready; skip session call')
    return
  }

  const idToken = liff.getIDToken()!
  const decoded: any = liff.getDecodedIDToken?.()
  const aud = decoded?.aud
  const sub = decoded?.sub
  console.log('[LIFF] ready. aud=', aud, 'sub=', sub)

  // aud が取れない＝scope=openid なし/設定不整合のことが多い
  if (!aud) {
    console.warn('[LIFF] aud missing. Check scope=openid & endpoint URL.')
    return
  }

  // 5) ここで初めてサーバ検証（初回 403 を防ぐ）
  try {
    await $fetch('/api/line/session', {
      method: 'POST',
      body: { idToken, clientId: aud },
    })
  } catch (e: any) {
    const status = e?.response?.status || e?.status || 0
    const msg = e?.data || e?.statusMessage || e?.message
    console.error(`[LIFF] /api/line/session failed (${status})`, msg)
  }
})
