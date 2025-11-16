// app/plugins/liff.client.ts
import liff from "@line/liff";

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return;

  const { public: pub } = useRuntimeConfig();
  if (pub.mockLiff) {
    const now = Math.floor(Date.now() / 1000);
    const decoded = {
      iss: "https://access.line.me",
      sub: pub.mockUserId || "U_MOCK_0001",
      aud: pub.loginChannelId || "MOCK",
      iat: now,
      exp: now + 24 * 60 * 60, // 24h
      amr: ["mock"],
    };

    const mockLiff = {
      // @ts-ignore: mock
      init: async () => {},
      isLoggedIn: () => true,
      // @ts-ignore: mock
      login: (_?: any) => {},
      getIDToken: () => "MOCK_ID_TOKEN",
      getDecodedIDToken: () => decoded,
      isInClient: () => false,
    };

    // 古いコードの互換：グローバルにも置いておく
    // @ts-ignore
    globalThis.liff = mockLiff;

    // Nuxt DI（推奨：以降は useNuxtApp().$liff で参照可能に）
    nuxtApp.provide("liff", mockLiff);

    console.info("[LIFF] Mock mode enabled", decoded);
    return;
  }

  const liffId = pub.liffId;
  const LOG_ENDPOINT = "https://bernard-unconnived-indomitably.ngrok-free.dev";

  const liffReady = useState<boolean>("__liff_ready__", () => false);

  async function logRemote(tag: string, data: any) {
    try {
      await fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tag, data }),
      });
    } catch (_) {
      // ログが死んでも本処理は止めない
    }
  }

  nuxtApp.hook("app:mounted", async () => {
    if (!liffId) {
      await logRemote("liff-init-error", {
        ts: new Date().toISOString(),
        message: "liffId is empty in runtimeConfig",
        liffId,
      });
      liffReady.value = false;
      return;
    }

    try {
      await liff.init({ liffId });
      const idToken = liff.getIDToken?.();
      const decoded = liff.getDecodedIDToken?.();

      await logRemote("liff-init-success", {
        ts: new Date().toISOString(),
        liffId,
        hasIdToken: !!idToken,
        decoded,
      });

      // ここまで来たら「送信してOK」
      liffReady.value = true;

      // もし初回でトークンなかったら、この場でログインに飛ばすこともできる
      if (!idToken || !decoded) {
        await logRemote("liff-init-login", {
          ts: new Date().toISOString(),
          reason: "init success but no idToken",
          liffId,
        });
        await liff.login({ redirectUri: location.href });
      }
    } catch (e: any) {
      await logRemote("liff-init-error", {
        ts: new Date().toISOString(),
        message: e?.message || String(e),
        liffTried: liffId, // ←ここをログするのが重要
        location: location.href,
      });
      liffReady.value = false;
    }
  });
});
