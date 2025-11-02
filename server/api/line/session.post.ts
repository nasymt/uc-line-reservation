// app/server/api/line/session.post.ts
export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken?: string }>(event)
  if (!idToken) throw createError({ statusCode: 400, statusMessage: 'idToken required' })

  const { loginChannelId } = useRuntimeConfig().public
  if (!loginChannelId) throw createError({ statusCode: 500, statusMessage: 'server misconfig: loginChannelId' })

  const res = await $fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: String(loginChannelId), // ← Secretではなく“数字のChannel ID”
    }),
  })
  const { sub } = res as { sub: string }
  return { userId: sub }
})
