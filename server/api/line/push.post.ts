// server/api/line/push.post.ts
export default defineEventHandler(async (event) => {
  const trace = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const LOG_ENDPOINT = 'https://bernard-unconnived-indomitably.ngrok-free.dev'

  async function logRemote(tag: string, data: any) {
    try {
      await $fetch(LOG_ENDPOINT, {
        method: 'POST',
        body: { tag, data },
      })
    } catch (e) {
      // ログ送信でサーバー処理を止めない
      console.warn('[srv-logRemote] failed', e)
    }
  }

  const bad = async (stage: string, detail: string, extra: any = {}, status = 400) => {
    const payload = { ok: false, trace, stage, detail, ...extra }
    await logRemote('srv-push-error', payload)
    setResponseStatus(event, status)
    setResponseHeader(event, 'content-type', 'application/json')
    return payload
  }

  const body = await readBody<{ idToken?: string; text?: string }>(event).catch(() => ({} as any))
  await logRemote('srv-push-start', {
    trace,
    rawBody: body,
    headers: event.node.req.headers,
  })

  const { idToken, text } = body
  if (!idToken) return bad('INPUT', 'idToken required')
  if (!text) return bad('INPUT', 'text required')

  // 1) decode
  let decoded: any
  try {
    const [, payload] = idToken.split('.')
    decoded = JSON.parse(Buffer.from(payload, 'base64').toString())
  } catch (e) {
    return bad('DECODE', 'invalid idToken format')
  }
  const aud = decoded?.aud
  if (!aud) return bad('DECODE', 'aud missing', { decoded })

  await logRemote('srv-push-decoded', {
    trace,
    aud,
    subInToken: decoded.sub,
    exp: decoded.exp,
  })

  // 2) verify
  let userId: string
  try {
    const vrfy: any = await $fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: idToken, client_id: aud }),
    })
    userId = vrfy.sub
    await logRemote('srv-push-verified', {
      trace,
      aud,
      userId,
      vrfy,
    })
  } catch (e: any) {
    return bad(
      'VERIFY',
      e?.data?.error_description || e?.data?.error || e?.message || 'verify failed',
      {
        aud,
        decoded,
        rawError: e?.data || String(e),
      },
      e?.response?.status || 400,
    )
  }

  // 3) profile取得で「この公式アカがその人を知ってるか」を確認
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!accessToken) {
    return bad('CONFIG', 'LINE_CHANNEL_ACCESS_TOKEN missing', { aud, userId }, 500)
  }

  let profileResult: any = null
  try {
    profileResult = await $fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (e: any) {
    profileResult = {
      error: true,
      status: e?.response?.status,
      message: e?.data?.message || e?.message,
    }
  }

  await logRemote('srv-push-profile', {
    trace,
    aud,
    userId,
    profileResult,
  })

  // 4) push本体
  try {
    await $fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        to: userId,
        messages: [{ type: 'text', text }],
      },
    })
  } catch (e: any) {
    return bad(
      'PUSH',
      e?.data?.message || e?.message || 'push failed',
      { aud, userId, profileResult, rawError: e?.data || String(e) },
      e?.response?.status || 400,
    )
  }

  const okPayload = { ok: true, trace, aud, userId, profileResult }
  await logRemote('srv-push-success', okPayload)
  return okPayload
})
