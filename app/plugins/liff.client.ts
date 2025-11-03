// app/plugins/liff.client.ts
import liff from '@line/liff'

export default defineNuxtPlugin(async () => {
  const { public: pub } = useRuntimeConfig()

  // 1. 初期化
  await liff.init({ liffId: pub.liffId })

  // 2. IDトークンをもう持ってるかチェック
  const idToken = liff.getIDToken?.()
  const decoded = liff.getDecodedIDToken?.()

  // 3. なかったら「いま」ログインして返ってきてもらう
  if (!idToken || !decoded) {
    // ここで一回だけLINE側に行く。LINEアプリ内ならID/PW画面じゃなくてそのまま戻ってくるはず。
    await liff.login({ redirectUri: location.href })
    return
  }

  // ここに来てる時点で「このLIFFでIDトークンが取れる状態」になってる
  console.log('[LIFF ready]', decoded?.sub, decoded?.aud)
})
