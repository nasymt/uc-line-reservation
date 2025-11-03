// server/api/line/session.post.ts
export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken?: string }>(event)
  if (!idToken) {
    throw createError({ statusCode: 400, statusMessage: 'idToken required' })
  }

  // トークンを自分で開けて、その中に書いてある aud (=ほんとの client_id) を使う
  let aud: string | undefined
  try {
    const [, payload] = idToken.split('.')
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
    aud = decoded.aud
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'invalid idToken format' })
  }

  if (!aud) {
    throw createError({ statusCode: 400, statusMessage: 'aud missing' })
  }

  // LINE公式に「このトークン本物？」って聞く
  const res = await $fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: aud, // ← ここをenvの値じゃなくて、トークンの中のaudにする
    }),
  }).catch((e: any) => {
    throw createError({
      statusCode: e?.response?.status || 400,
      statusMessage: e?.data?.error_description || e?.message || 'verify failed',
    })
  })

  // 通ったら userId を返す
  const { sub } = res as { sub: string }
  return { ok: true, userId: sub }
})
