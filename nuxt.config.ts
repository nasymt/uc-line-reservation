// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: { host: "0.0.0.0", port: 3000 },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["vuetify-nuxt-module", "@pinia/nuxt"],
  ssr: true,
  srcDir: "app/",
  runtimeConfig: {
    public: {
      liffId: process.env.NUXT_PUBLIC_LIFF_ID,
      loginChannelId: process.env.LINE_LOGIN_CHANNEL_ID,
      mockLiff: process.env.NUXT_PUBLIC_MOCK_LIFF === "1",
    },
    line: {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    },
  },
  vite: {
    server: {
      cors: true,
      // allowedHosts: ['bernard-unconnived-indomitably.ngrok-free.dev'],
      allowedHosts: true,

      // HMR を wss 経由で ngrok ドメインへ
      hmr: {
        protocol: "wss",
        host: process.env.NGROK_HOST,
        port: 443,
        clientPort: 443,
      },
      fs: { strict: false },
      origin: process.env.NGROK_HOST
        ? `https://${process.env.NGROK_HOST}`
        : undefined,
    },
  },
  nitro: {
    preset: "vercel",
    scanDirs: ["app/server"],
    // handlers: [
    //   { route: '/api/ping', handler: '~/server/handlers/ping.ts', method: 'get' },
    // ],
  },
});
