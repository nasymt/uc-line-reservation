// server/api/line/push.post.ts
export default defineEventHandler(async (event) => {
  const trace = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const bad = (stage: string, detail: string, status = 400) => {
    setResponseStatus(event, status)
    setResponseHeader(event, 'content-type', 'application/json')
    return send(
      event,
      JSON.stringify({ ok: false, trace, stage, detail })
    )
  }

  const { idToken, text } = await readBody<{ idToken?: string; text?: string }>(event).catch(() => ({} as any))
  if (!idToken) return bad('INPUT', 'idToken required')
  if (!text)    return bad('INPUT', 'text required')

  // ... ここに verify → push の処理を入れる（前に書いたやつ）

  return { ok: true, trace }
})
