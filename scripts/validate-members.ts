import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Build-time guard for members.json (AC-2.5): every entry must have a
 * non-empty `name` and an absolute `url`, and origins must be unique
 * (a ring with two entries on the same origin is a config error).
 * Exits non-zero with a readable message on any violation.
 */
const path = resolve(import.meta.dirname, '..', 'members.json')
const fail = (msg: string): never => {
  process.stderr.write(`[validate-members] ${msg}\n`)
  process.exit(1)
}

const raw = JSON.parse(readFileSync(path, 'utf8')) as { members?: unknown }
if (!Array.isArray(raw.members)) fail('`members` must be an array')
const members = raw.members as readonly unknown[]
if (members.length === 0) fail('`members` is empty')

const origins = new Set<string>()
members.forEach((entry, i) => {
  if (typeof entry !== 'object' || entry === null) fail(`#${i}: not an object`)
  const { url, name } = entry as Record<string, unknown>
  if (typeof name !== 'string' || name.trim() === '')
    fail(`#${i}: missing/empty "name"`)
  if (typeof url !== 'string') fail(`#${i}: missing "url"`)
  let origin: string
  try {
    origin = new URL(url as string).origin
  } catch {
    return fail(`#${i}: "url" is not an absolute URL: ${String(url)}`)
  }
  if (origins.has(origin)) fail(`duplicate origin: ${origin}`)
  origins.add(origin)
})

process.stdout.write(`[validate-members] ok — ${members.length} members\n`)
