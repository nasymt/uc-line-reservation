// server/api/line/push.post.ts
import { messagingApi } from '@line/bot-sdk'

export default defineEventHandler(async (event) => {
  const { userId, text, messages } = await readBody(event)
  if (!userId) throw createError({ statusCode: 400, statusMessage: 'userId required' })

  const config = useRuntimeConfig()
  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: config.line.channelAccessToken
  })

  await client.pushMessage({
    to: userId,
    messages: messages ?? [{ type: 'text', text: text ?? 'Hello!' }]
  })

  return { ok: true }
})
