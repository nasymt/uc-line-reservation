export default defineNuxtRouteMiddleware(async (to) => {
  const requiresAuth = to.meta?.requiresAuth === true;
  const isLoginPage = to.path === "/login";

  // --- SSR（直叩き時の判定＆302リダイレクト） ---
  if (import.meta.server && requiresAuth) {
    const event = useRequestEvent();
    if (!event) return;
    // server-only ファイルを動的 import（クライアントに混ざらないように）
    // const { getServerSupabase } = await import("../server/utils/supabaseServer");
    const { getServerSupabase } = await import("../../server/utils/supabaseServer");
    const supabase = getServerSupabase(event);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`, {
        redirectCode: 302,
      });
    }
  }

  // --- CSR（ルーター遷移時の保険） ---
  if (import.meta.client) {
    const { $supabase } = useNuxtApp();
    const {
      data: { session },
    } = await $supabase.auth.getSession();

    if (requiresAuth && !session) {
      return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
    }
    if (isLoginPage && session) {
      const back = (to.query.redirect as string) || "/dashboard";
      return navigateTo(back);
    }
  }
});
