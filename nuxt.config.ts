// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["vuetify-nuxt-module", "@pinia/nuxt"],
  ssr: true,
  srcDir: "app/",
  runtimeConfig: {
    supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY, // ★サーバ専用（クライアントへ出さない）
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
      liffId: process.env.NUXT_PUBLIC_LIFF_ID,
    },
    line: {
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    },
  },
  nitro: {
    preset: "node",
    scanDirs: ["app/server"],
    // handlers: [
    //   { route: '/api/ping', handler: '~/server/handlers/ping.ts', method: 'get' },
    // ],
  },
});
