import liff from "@line/liff";

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig();
  await liff.init({ liffId: config.public.liffId as string });
  if (!liff.isLoggedIn()) liff.login(); // LINE内なら即ログイン
});
