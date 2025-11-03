// app/server/api/line/push.post.ts

interface RequestBody {
  idToken?: string
  text?: string
}

interface IdTokenPayload {
  aud?: string
  sub?: string
  exp?: number
  iss?: string
}

interface LineVerifyResponse {
  sub: string
}

interface LineProfile {
  displayName?: string
}

interface ApiResponse {
  ok: boolean
  trace: string
  stage?: string
  detail?: string
  to?: string
}

export default defineEventHandler(async (event) => {
  const trace: string = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const log = (...a: any[]) => console.log(`[line/push][${trace}]`, ...a)

  const bad = (stage: string, detail: string, status: number = 400) => {
    log('ERR', stage, detail)
    // 失敗でも必ず JSON を返す（デバッグしやすく）
    setResponseStatus(event, status)
    return send(event, JSON.stringify({ ok: false, trace, stage, detail }), 'application/json')
  }

  try {
    const body: RequestBody = await readBody<RequestBody>(event).catch(() => ({} as RequestBody))
    log('REQ', {
      ua: getHeader(event, 'user-agent'),
      referer: getHeader(event, 'referer'),
      hasIdToken: !!body?.idToken,
      textLen: body?.text?.length ?? 0,
    })

    if (!body?.idToken) return bad('INPUT', 'idToken required')
    if (!body?.text)    return bad('INPUT', 'text required')

    const accessToken: string | undefined = process.env.LINE_CHANNEL_ACCESS_TOKEN
    if (!accessToken) return bad('CONFIG', 'LINE_CHANNEL_ACCESS_TOKEN missing', 500)

    // ---- IDトークンを安全にデコードしてログ（先頭/末尾のみ）
    let aud: string = ''
    try {
      const [, payload]: string[] = body.idToken.split('.')
      const decoded: IdTokenPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
      aud = decoded?.aud || ''
      log('IDTOKEN', {
        aud,
        sub: decoded?.sub,
        exp: decoded?.exp,
        iss: decoded?.iss,
      })
    } catch (e: any) {
      return bad('DECODE', `invalid idToken: ${e?.message || e}`)
    }

    if (!aud) return bad('DECODE', 'aud missing in idToken')

    // ---- verify
    let userId: string
    try {
      const vrfy: LineVerifyResponse = await $fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_token: body.idToken!, client_id: aud }),
      })
      log('VERIFY_OK', vrfy)
      userId = vrfy.sub
    } catch (e: any) {
      const status: number = e?.response?.status || 400
      const msg: string = e?.data?.error_description || e?.data?.error || e?.message || 'verify failed'
      return bad('VERIFY', msg, status)
    }

    // ---- 任意：友だち状態/プロファイル確認（デバッグに役立つ）
    try {
      const prof: LineProfile = await $fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      log('PROFILE_OK', { displayName: prof?.displayName })
    } catch (e: any) {
      const status: number = e?.response?.status
      const msg: string = e?.data?.message || e?.message
      log('PROFILE_NG', { status, msg })
      // 404 の場合は「友だちでない」ことが多い
    }

    // ---- push
    try {
      const res: any = await $fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Debug-Trace': trace,
        },
        body: { to: userId, messages: [{ type: 'text', text: body.text }] },
      })
      setResponseStatus(event, 200)
      return send(event, JSON.stringify({ ok: true, trace, to: userId }), 'application/json')
    } catch (e: any) {
      const status: number = e?.response?.status || 400
      const msg: string = e?.data?.message || e?.message || 'push failed'
      return bad('PUSH', msg, status)
    }
  } catch (e: any) {
    setResponseStatus(event, 500)
    return send(event, JSON.stringify({
      ok: false, trace: 'fatal', stage: 'FATAL', detail: e?.message || String(e)
    }), 'application/json')
  }
})
