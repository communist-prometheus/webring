import type { Member } from './members'

/**
 * Pick one member uniformly at random (AC-1.1). The RNG is injected so
 * tests are deterministic; production passes `Math.random`.
 *
 * @param members - Eligible members to choose among.
 * @param rng - Returns a float in [0, 1).
 * @returns The chosen member, or `undefined` when the list is empty
 *   (the "ring unavailable" signal, AC-1.3).
 */
export const pickRandom = (
  members: readonly Member[],
  rng: () => number
): Member | undefined => {
  if (members.length === 0) return undefined
  const index = Math.floor(rng() * members.length)
  // Guard against rng() returning exactly 1 or tiny float drift.
  const safe = Math.min(Math.max(index, 0), members.length - 1)
  return members[safe]
}
