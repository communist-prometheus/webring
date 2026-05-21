import { type Member, type MembersDoc, parseMembers } from './members'

interface LoadDeps {
  /** Injected `fetch` (real in prod, stub in tests). */
  readonly fetchFn: typeof fetch
  /** Canonical members JSON URL (or host-supplied `src`). */
  readonly srcUrl: string
  /** Bundled fallback document, shipped in the build. */
  readonly bundled: MembersDoc
}

const tryFetch = async (
  fetchFn: typeof fetch,
  srcUrl: string
): Promise<readonly Member[]> => {
  const res = await fetchFn(srcUrl, { mode: 'cors' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const doc = (await res.json()) as { members?: unknown }
  const members = parseMembers(doc.members)
  // An empty parse is treated as a failed source so we fall back to
  // the bundled list rather than render an empty ring (AC-2.3).
  if (members.length === 0) throw new Error('empty members')
  return members
}

/**
 * Load ring members: fetch the canonical JSON, and on ANY failure
 * (network, CORS, non-2xx, malformed, empty) fall back to the bundled
 * list. Never throws — a broken source must not break the host page
 * (AC-2.2, AC-2.3).
 *
 * @param deps - Injected `fetchFn`, source URL, and bundled fallback.
 * @returns The members to operate on.
 */
export const loadMembers = async (deps: LoadDeps): Promise<readonly Member[]> => {
  try {
    return await tryFetch(deps.fetchFn, deps.srcUrl)
  } catch {
    return parseMembers(deps.bundled.members)
  }
}
