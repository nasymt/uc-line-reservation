// server/api/line/push.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{ idToken?: string; text?: string }>(event)
  if (!body?.idToken) throw createError({ statusCode: 400, statusMessage: 'idToken required' })
  if (!body?.text) throw createError({ statusCode: 400, statusMessage: 'text required' })

  // 1) idTokenからaudとsubを取り出す
  let aud: string | undefined
  try {
    const [, payload] = body.idToken.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    aud = decoded.aud
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'invalid idToken format' })
  }
  if (!aud) throw createError({ statusCode: 400, statusMessage: 'aud missing' })

  // 2) verify
  const vrfy = await $fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: body.idToken, client_id: aud }),
  }).catch((e: any) => {
    throw createError({
      statusCode: e?.response?.status || 400,
      statusMessage: e?.data?.error_description || e?.message || 'verify failed',
    })
  })

  const userId = (vrfy as any).sub as string

  // 3) push
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw createError({ statusCode: 500, statusMessage: 'no channel access token' })

  await $fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: {
      to: userId,
      messages: [{ type: 'text', text: body.text }],
    },
  }).catch((e: any) => {
    throw createError({
      statusCode: e?.response?.status || 400,
      statusMessage: e?.data?.message || e?.message || 'push failed',
    })
  })

  return { ok: true }
})
