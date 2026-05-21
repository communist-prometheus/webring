/**
 * One ring member. `url` is a validated absolute URL string; `name`
 * is a non-empty display name. `lang`/`description` are optional.
 */
export interface Member {
  readonly url: string
  readonly name: string
  readonly lang?: string
  readonly description?: string
}

/** The shape of a `members.json` document. */
export interface MembersDoc {
  readonly ring: string
  readonly members: readonly Member[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

const isAbsoluteUrl = (value: string): boolean => {
  try {
    // Throws on relative/invalid; we only accept parseable absolutes.
    void new URL(value)
    return true
  } catch {
    return false
  }
}

const toMember = (raw: unknown): Member | undefined => {
  if (!isRecord(raw)) return undefined
  const { url, name, lang, description } = raw
  if (typeof url !== 'string' || !isAbsoluteUrl(url)) return undefined
  if (typeof name !== 'string' || name.trim() === '') return undefined
  return {
    url,
    name,
    ...(typeof lang === 'string' ? { lang } : {}),
    ...(typeof description === 'string' ? { description } : {}),
  }
}

/**
 * Parse a raw `members` value into validated `Member`s, skipping any
 * malformed entry rather than rejecting the whole list (AC-2.4).
 *
 * @param raw - The `members` array from a parsed JSON document, or any
 *   untrusted value.
 * @returns The valid members; empty array when `raw` is not an array.
 */
export const parseMembers = (raw: unknown): readonly Member[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map(toMember)
    .filter((m): m is Member => m !== undefined)
}
