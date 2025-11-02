// server/api/data.get.ts
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const file = String(q.file || '').replace(/[^a-z0-9_.-]/gi, '')
  if (!file) throw createError({ statusCode: 400, statusMessage: 'file required' })

  // ~/server/data/*.json をビルド時に取り込む
  const modules = import.meta.glob('~/server/data/*.json', { eager: true, import: 'default' })
  const map = Object.fromEntries(
    Object.entries(modules).map(([k, v]) => [k.split('/').pop()!, v as unknown])
  )

  const data = map[file]
  if (!data) throw createError({ statusCode: 404, statusMessage: 'file not found' })
  return data
})
