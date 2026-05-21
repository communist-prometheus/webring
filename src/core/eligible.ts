import type { Member } from './members'

/**
 * The members a "Random site" jump may target: present in the list
 * AND whose origin differs from the current page's origin (AC-1.2).
 * Entries with an unparseable URL are dropped defensively.
 *
 * @param members - Parsed ring members.
 * @param currentOrigin - `location.origin` of the host page.
 * @returns The eligible members (possibly empty).
 */
export const eligible = (
  members: readonly Member[],
  currentOrigin: string
): readonly Member[] =>
  members.filter((m) => {
    try {
      return new URL(m.url).origin !== currentOrigin
    } catch {
      return false
    }
  })
