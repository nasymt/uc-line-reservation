// server/api/line/session.post.ts
export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken: string }>(event);
  if (!idToken)
    throw createError({ statusCode: 400, statusMessage: "idToken required" });

  const { channelSecret } = useRuntimeConfig().line;

  // LINE Loginの Verify ID token エンドポイントで検証
  const res = await $fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelSecret,
    }),
  });

  // 検証済みペイロードから userId を取得（= sub）
  const { sub } = res as { sub: string };
  // 必要ならクッキー等にセッション化
  // setCookie(event, 'uid', sub, { httpOnly: true, sameSite: 'lax', secure: true })
  return { userId: sub };
});
