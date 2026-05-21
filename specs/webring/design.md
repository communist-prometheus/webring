# Webring «Революционные интернационалисты» — Design

Tracks: communist-prometheus/tickets#22 · implements
[`requirements.md`](./requirements.md)

## 1. Architecture overview

```
 host page (any member site)
   │  <script src="https://cdn.comprom.org/webring.<hash>.js" type="module">
   │  <revint-webring></revint-webring>
   ▼
 ┌─────────────────────────────────────────────┐
 │ custom element  <revint-webring>            │  imperative shell
 │  - Shadow DOM (style isolation + default UI) │
 │  - reads attrs (src), renders button + slot  │
 │  - on click → pick() → location.assign()     │
 └───────────────┬─────────────────────────────┘
                 │ delegates all decisions to:
                 ▼
 ┌─────────────────────────────────────────────┐
 │ pure core (no DOM, no globals)               │  functional core
 │  loadMembers(fetchFn, bundled, srcUrl)       │
 │  parseMembers(json) → Member[]               │
 │  eligible(members, currentOrigin) → Member[] │
 │  pickRandom(members, rng) → Member | none    │
 └─────────────────────────────────────────────┘
       ▲ fetched at runtime, fallback bundled
 ┌─────────────────────────────────────────────┐
 │ members.json  (cdn.comprom.org/members.json) │  single source of truth
 └─────────────────────────────────────────────┘
```

Split rationale: a **pure functional core** (parse / filter / pick,
all dependency-injected: `fetch`, `rng`, `currentOrigin`) keeps the
testable logic free of DOM and globals; the **custom element** is a
thin imperative shell wiring the core to the browser. This matches the
project's layered/FP preference and lets the core be unit-tested
without a browser.

## 2. Tech stack

| Concern | Choice | Why / rejected |
|---|---|---|
| Component model | **Vanilla custom element** + Shadow DOM | Framework-agnostic embed (AC-3.2); zero host deps. Rejected: Lit (adds a runtime dep on host bundle), Stencil (heavier toolchain) — overkill for one button. |
| Language | **TypeScript** | Type safety per project rules; compiled away in the bundle. |
| Build | **Vite library mode** → single self-contained ESM | Matches the org's Vite usage; tree-shaken, one file. Output filename **content-hashed** for immutable caching (`webring.<hash>.js`) — see project memory on hash-named assets. A stable alias `webring.js` (short-cache) re-exports for partners who want "latest". |
| Styling | Shadow DOM `<style>` with default theme + `::part` + custom props | Encapsulation (AC-3.4) + headless override hooks (AC-3.5). |
| Tests | **vitest** (pure core) + **Playwright** (element in real browser) | Core logic unit-tested headless; DOM/navigation/a11y in a real engine. |
| Hosting | **Cloudflare R2 bucket** + custom domain `cdn.comprom.org` | Pure static files (bundle + JSON + css); zero egress (PDFs/large assets benefit org-wide). No Worker needed — R2 custom domain serves objects directly; CORS via bucket policy, Content-Type/Cache-Control via object metadata. Rejected Worker Static Assets here: the webring has no routing/404/SPA needs, so the Worker layer adds nothing R2 doesn't cover for static blobs. |

## 3. Data model

`members.json` (canonical, also bundled):

```jsonc
{
  "$schema": "./members.schema.json",
  "ring": "revolutionary-internationalists",
  "members": [
    {
      "url": "https://comprom.org/",      // required, absolute
      "name": "Communist Prometheus",      // required, non-empty
      "lang": "en",                         // optional BCP-47
      "description": "…"                    // optional
    }
    // seed: comprom.org + placeholders (owner to fill real members)
  ]
}
```

TypeScript contract (the core's view):

```ts
interface Member {
  readonly url: string;       // validated absolute URL
  readonly name: string;
  readonly lang?: string;
  readonly description?: string;
}
interface MembersDoc {
  readonly ring: string;
  readonly members: readonly Member[];
}
```

## 4. Core interfaces (pure, dependency-injected)

```ts
// parse + validate one raw entry; skip-on-malformed is the caller's job
const parseMembers: (raw: unknown) => readonly Member[];

// origin-aware eligibility (AC-1.2)
const eligible: (
  members: readonly Member[],
  currentOrigin: string,
) => readonly Member[];

// uniform random pick; rng injected for deterministic tests (AC-1.1)
const pickRandom: (
  members: readonly Member[],
  rng: () => number,        // [0,1)
) => Member | undefined;    // undefined ⇒ ring unavailable (AC-1.3)

// fetch-with-fallback (AC-2.2/2.3); fetchFn + bundled injected
const loadMembers: (deps: {
  readonly fetchFn: typeof fetch;
  readonly srcUrl: string;
  readonly bundled: MembersDoc;
}) => Promise<readonly Member[]>;
```

`pickRandom` returning `undefined` (not throwing) models the
"ring unavailable" state declaratively (AC-1.3).

## 5. Selection algorithm (AC-1.1/1.2/1.3)

1. `members = await loadMembers(...)` — fetched or bundled.
2. `pool = eligible(members, location.origin)` — drop entries whose
   `new URL(m.url).origin === location.origin`, and any that failed
   URL parsing.
3. If `pool` is empty → element enters **unavailable** state, button
   `disabled`, no navigation.
4. On activation → `target = pickRandom(pool, Math.random)` →
   `location.assign(target.url)`.

Uniform random = `pool[Math.floor(rng() * pool.length)]`. No storage,
no history read (per locked decision).

## 6. Fetch-with-fallback flow (AC-2.2/2.3/2.4)

```
init →
  try:
    res = await fetchFn(srcUrl, { mode:'cors' })
    if !res.ok → throw
    doc = parse(await res.json())
    members = parseMembers(doc.members)   // skips malformed entries
    if members.length === 0 → throw       // treat empty as failure
  catch (any):
    members = parseMembers(bundled.members)   // bundled fallback
```

All failures (network, CORS, non-2xx, JSON error, empty) collapse to
the bundled list. Never throws to the host page (AC-2.3).

## 7. Styling / theming API (AC-3.3/3.4/3.5)

- **Default styles** live in the Shadow DOM `<style>`; the component
  looks finished with zero config.
- **`::part(button)`** exposed on the control for host CSS overrides.
- **Custom properties** for light theming without `::part`:
  `--revint-bg`, `--revint-fg`, `--revint-accent`, `--revint-radius`,
  `--revint-font`. Defaults reference the host's own tokens where
  sensible, else hard defaults.
- **`<slot>`** inside the button to replace the default label
  ("Случайный сайт кольца" / localised) with host content.
- `prefers-reduced-motion` honoured for the hover/active transition
  (AC-4.4).

## 8. Accessibility (AC-4)

- Control is a native `<button type="button">` — keyboard + AT for
  free (AC-4.1).
- Accessible name from the slotted label or a default `aria-label`.
- Unavailable state → `disabled` attribute (removed from tab order)
  plus `aria-disabled` mirror + visible muted styling (AC-4.2).
- Default palette meets WCAG AA on its own background (AC-4.3);
  documented contrast pair.

## 9. Build & distribution (`cdn.comprom.org` via R2)

- **Cloudflare R2 bucket** (e.g. `webring`) with a **custom domain**
  binding `cdn.comprom.org` — serves objects directly, no Worker.
- Objects: `webring.<hash>.js` (immutable, `Cache-Control:
  public,max-age=31536000,immutable`), `webring.js` (alias, short
  cache for "latest"), `members.json` (short cache so member edits go
  live without rebuild), optional `webring.css` for hosts opting out
  of Shadow DOM defaults.
- **CORS**: an R2 **bucket CORS policy** allows `GET` from
  `AllowedOrigins: ["*"]` so any partner origin can `fetch`
  `members.json` and the bundle. (No `_headers` file — that's a
  Workers/Pages feature; R2 uses its bucket CORS rules.)
- **Content-Type / Cache-Control** set per object as **R2 metadata**
  at upload (`wrangler r2 object put --content-type … --cache-control
  …`), since R2 has no on-the-fly header rules.
- **Deploy**: GitHub Actions on push to master → `bun run build` →
  upload each `dist/` artifact via `wrangler r2 object put`. The
  hashed JS is write-once; `webring.js`, `members.json`, `webring.css`
  are overwritten each deploy.
- **One-time infra**: create the R2 bucket, attach `cdn.comprom.org`
  as a custom domain, set the CORS policy. Needs a CF token with R2
  edit scope (the `.env` `cfat_` token is Workers-scoped and won't
  work — same limitation hit during the DNS task).

## 10. Testing strategy (TDD)

- **Unit (vitest)** — the pure core: `parseMembers` (valid / missing
  fields / bad URL / non-array), `eligible` (same-origin drop, bad
  URL drop), `pickRandom` (uniform via seeded rng, empty→undefined),
  `loadMembers` (fetch ok / non-2xx / network throw / empty →
  fallback) with an injected `fetchFn`.
- **Component (Playwright)** — mount `<revint-webring>` on a test
  page; assert: renders button with default styles; click navigates
  to an eligible member (intercept navigation, assert origin differs);
  ring-of-one → disabled, no navigation; `src` override fetched;
  fetch failure → bundled still works; keyboard activation; reduced
  motion. Each test ↔ an AC.
- E2E first / failing-first per the project's TDD rule.

## 11. Repo structure (`communist-prometheus/webring`)

```
webring/
  src/
    core/                 # pure, no DOM
      members.ts          # Member type + parseMembers
      eligible.ts
      pick.ts
      load.ts             # loadMembers (fetch+fallback)
      core.test.ts
    element/
      revint-webring.ts   # custom element (shell)
      styles.ts           # default Shadow DOM CSS
    index.ts              # registers the element
  members.json            # bundled seed (source of truth mirror)
  members.schema.json
  scripts/validate-members.ts   # build-time JSON validation (AC-2.5)
  e2e/                    # Playwright component tests
  wrangler.jsonc          # R2 bucket binding + deploy config
  r2-cors.json            # R2 bucket CORS policy (GET *)
  vite.config.ts
  package.json
  specs/webring/          # this spec
```

## 12. Traceability

| Requirement | Design section |
|---|---|
| AC-1.1/1.2/1.4 | §4 `pickRandom`/`eligible`, §5 |
| AC-1.3 | §4 (undefined), §5 step 3, §8 unavailable |
| AC-2.1/2.4/2.5 | §3 model, §4 `parseMembers`, §11 validate script |
| AC-2.2/2.3 | §4 `loadMembers`, §6 flow |
| AC-3.1/3.2 | §2 stack, §9 dist |
| AC-3.3/3.4/3.5/3.6 | §7 theming, §4 (`src`) |
| AC-4.1/4.2/4.3/4.4 | §8 a11y |

## 13. Resolved design questions

1. **`cdn.comprom.org` serving** — ✅ **R2 bucket + custom domain**, no
   Worker (§9). Owner also flagged migrating heavy media (newspaper
   PDF/FB2, covers) off the public-website bundle onto R2 as a
   **separate future initiative** — not part of this spec.
2. **Default label & i18n** — ✅ neutral default label + `lang`
   attribute selecting a small built-in string table; `<slot>`
   overrides for the host.
3. **`members.json` source of truth** — ✅ in-repo, deployed to
   `cdn.comprom.org/members.json`.
