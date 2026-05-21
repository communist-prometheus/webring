import { describe, expect, it } from 'vitest'
import { eligible } from './eligible'
import { loadMembers } from './load'
import { type Member, type MembersDoc, parseMembers } from './members'
import { pickRandom } from './pick'

const m = (url: string, name = 'X'): Member => ({ url, name })

describe('parseMembers', () => {
  it('keeps valid entries with required + optional fields', () => {
    const out = parseMembers([
      { url: 'https://a.org/', name: 'A', lang: 'en', description: 'd' },
      { url: 'https://b.org/', name: 'B' },
    ])
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual({
      url: 'https://a.org/',
      name: 'A',
      lang: 'en',
      description: 'd',
    })
    expect(out[1]).toEqual({ url: 'https://b.org/', name: 'B' })
  })

  it('skips entries missing url or name (AC-2.4)', () => {
    const out = parseMembers([
      { name: 'no url' },
      { url: 'https://ok.org/' }, // no name
      { url: 'https://ok.org/', name: '   ' }, // blank name
      { url: 'https://good.org/', name: 'Good' },
    ])
    expect(out).toEqual([{ url: 'https://good.org/', name: 'Good' }])
  })

  it('skips entries with an unparseable / relative URL', () => {
    const out = parseMembers([
      { url: '/relative', name: 'rel' },
      { url: 'not a url', name: 'bad' },
      { url: 'https://good.org/', name: 'Good' },
    ])
    expect(out).toEqual([{ url: 'https://good.org/', name: 'Good' }])
  })

  it('returns [] for a non-array', () => {
    expect(parseMembers(undefined)).toEqual([])
    expect(parseMembers({})).toEqual([])
    expect(parseMembers('nope')).toEqual([])
  })
})

describe('eligible (AC-1.2)', () => {
  const here = 'https://comprom.org'
  it('drops members on the current origin', () => {
    const out = eligible(
      [m('https://comprom.org/page'), m('https://other.org/')],
      here
    )
    expect(out.map((x) => x.url)).toEqual(['https://other.org/'])
  })

  it('keeps different-origin members (any path)', () => {
    const out = eligible([m('https://other.org/deep/path')], here)
    expect(out).toHaveLength(1)
  })

  it('drops members with an unparseable URL defensively', () => {
    const out = eligible([{ url: 'garbage', name: 'g' }, m('https://ok.org/')], here)
    expect(out.map((x) => x.url)).toEqual(['https://ok.org/'])
  })
})

describe('pickRandom (AC-1.1, AC-1.3)', () => {
  const pool = [m('https://a.org/'), m('https://b.org/'), m('https://c.org/')]

  it('uses the injected rng to index deterministically', () => {
    expect(pickRandom(pool, () => 0)?.url).toBe('https://a.org/')
    expect(pickRandom(pool, () => 0.5)?.url).toBe('https://b.org/')
    expect(pickRandom(pool, () => 0.999)?.url).toBe('https://c.org/')
  })

  it('clamps rng() === 1 to the last element (no overflow)', () => {
    expect(pickRandom(pool, () => 1)?.url).toBe('https://c.org/')
  })

  it('returns undefined for an empty pool (ring unavailable)', () => {
    expect(pickRandom([], Math.random)).toBeUndefined()
  })

  it('is roughly uniform over many draws', () => {
    const counts = new Map<string, number>()
    let seed = 0
    const rng = () => {
      // Cheap deterministic LCG for distribution sanity.
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      return seed / 0x7fffffff
    }
    for (let i = 0; i < 3000; i++) {
      const url = pickRandom(pool, rng)?.url ?? ''
      counts.set(url, (counts.get(url) ?? 0) + 1)
    }
    for (const member of pool) {
      // Each of 3 buckets should land near 1000; allow generous slack.
      expect(counts.get(member.url) ?? 0).toBeGreaterThan(700)
    }
  })
})

describe('loadMembers (AC-2.2, AC-2.3)', () => {
  const bundled: MembersDoc = {
    ring: 'r',
    members: [{ url: 'https://bundled.org/', name: 'Bundled' }],
  }
  const json = (body: unknown, ok = true, status = 200): typeof fetch =>
    (async () =>
      ({
        ok,
        status,
        json: async () => body,
      }) as unknown as Response) as typeof fetch

  it('returns fetched members on 2xx + valid body', async () => {
    const out = await loadMembers({
      fetchFn: json({ members: [{ url: 'https://live.org/', name: 'Live' }] }),
      srcUrl: 'https://cdn/members.json',
      bundled,
    })
    expect(out.map((x) => x.url)).toEqual(['https://live.org/'])
  })

  it('falls back to bundled on non-2xx', async () => {
    const out = await loadMembers({
      fetchFn: json({ members: [] }, false, 503),
      srcUrl: 'x',
      bundled,
    })
    expect(out.map((x) => x.url)).toEqual(['https://bundled.org/'])
  })

  it('falls back to bundled when fetch throws (network/CORS)', async () => {
    const fetchFn = (async () => {
      throw new Error('network down')
    }) as typeof fetch
    const out = await loadMembers({ fetchFn, srcUrl: 'x', bundled })
    expect(out.map((x) => x.url)).toEqual(['https://bundled.org/'])
  })

  it('falls back to bundled when fetched list parses empty', async () => {
    const out = await loadMembers({
      fetchFn: json({ members: [{ name: 'no url' }] }),
      srcUrl: 'x',
      bundled,
    })
    expect(out.map((x) => x.url)).toEqual(['https://bundled.org/'])
  })

  it('falls back to bundled on malformed json', async () => {
    const fetchFn = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('bad json')
        },
      }) as unknown as Response) as typeof fetch
    const out = await loadMembers({ fetchFn, srcUrl: 'x', bundled })
    expect(out.map((x) => x.url)).toEqual(['https://bundled.org/'])
  })
})
