// server/api/data.get.ts
import { readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { defineEventHandler, getQuery, createError } from 'h3'

const ALLOWED = new Set(['classes.json', 'schedule.json', 'courses.json' /* 'teachers.json', ... */])

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const raw = typeof q.file === 'string' ? q.file : ''
  const file = basename(raw)
  if (!ALLOWED.has(file)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown file' })
  }
  const p = join(process.cwd(), 'server', 'data', file)
  return JSON.parse(await readFile(p, 'utf8'))
})
