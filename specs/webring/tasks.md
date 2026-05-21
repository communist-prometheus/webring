# Webring «Революционные интернационалисты» — Tasks

Tracks: communist-prometheus/tickets#22 · implements
[`design.md`](./design.md) ← [`requirements.md`](./requirements.md)

Ordered, small-grained, TDD (failing test first). Keep the tree green
between tasks. Each task names the requirement(s) and the test(s).

## Phase 0 — scaffold

- [ ] **T0.1** Init repo skeleton: `package.json` (type module),
  `tsconfig.json`, vitest + Playwright config, biome/lint to match
  org rules. _No test; build/lint must pass._
- [ ] **T0.2** Seed `members.json` (comprom.org + 2 placeholders) +
  `members.schema.json`. Ref AC-2.1.

## Phase 1 — pure core (vitest, failing-first)

- [ ] **T1.1** `core/members.ts`: `Member` type + `parseMembers(raw)`.
  Tests: valid array; skip entry missing `url`/`name`; skip
  unparseable URL; non-array → `[]`. Ref AC-2.1, AC-2.4.
- [ ] **T1.2** `core/eligible.ts`: `eligible(members, currentOrigin)`
  drops same-origin + bad-URL entries. Tests: same-origin dropped;
  different-origin kept; bad URL dropped. Ref AC-1.2.
- [ ] **T1.3** `core/pick.ts`: `pickRandom(members, rng)`. Tests:
  seeded rng picks expected index; empty → `undefined`; distribution
  is uniform over many seeded calls. Ref AC-1.1, AC-1.3.
- [ ] **T1.4** `core/load.ts`: `loadMembers({fetchFn,srcUrl,bundled})`.
  Tests (injected `fetchFn`): 2xx+valid → fetched; non-2xx → bundled;
  fetch throws → bundled; empty parsed → bundled; malformed json →
  bundled. Never throws. Ref AC-2.2, AC-2.3.

## Phase 2 — custom element shell (Playwright, failing-first)

- [ ] **T2.1** `element/styles.ts` + `element/revint-webring.ts`:
  register `<revint-webring>`, Shadow DOM, default-styled
  `<button part="button">` with slotted label. Test: element upgrades,
  renders a visible button with default styling. Ref AC-3.1, AC-3.3,
  AC-3.4.
- [ ] **T2.2** Wire click → `loadMembers` → `eligible` →
  `pickRandom` → `location.assign`. Test: click navigates to an
  eligible member with differing origin (intercept navigation). Ref
  AC-1.1.
- [ ] **T2.3** Unavailable state: ring-of-one / empty pool → button
  `disabled` + `aria-disabled`, no navigation on click. Ref AC-1.3,
  AC-4.2.
- [ ] **T2.4** `src` attribute override + fetch-failure fallback in a
  real browser: stub network, assert bundled still navigates. Ref
  AC-2.2, AC-2.3, AC-3.6.
- [ ] **T2.5** Theming hooks: `::part(button)` override + `--revint-*`
  custom props + `<slot>` label replacement. Test: host CSS overrides
  apply; slotted label shows. Ref AC-3.5.
- [ ] **T2.6** A11y: keyboard activation (Enter/Space), accessible
  name, WCAG AA contrast on defaults, `prefers-reduced-motion`
  honoured. Ref AC-4.1–4.4.
- [ ] **T2.7** i18n: neutral default label + `lang` attribute selects
  a built-in string; slot still overrides. Ref design §13.2.

## Phase 3 — build & validation

- [ ] **T3.1** `scripts/validate-members.ts`: build-time JSON
  validation (absolute URLs, unique origins, required fields); wire
  into build so it fails on violation. Ref AC-2.5.
- [ ] **T3.2** Vite library build → single self-contained ESM,
  content-hashed filename + `webring.js` alias + optional
  `webring.css`. Verify bundle has no external runtime deps.

## Phase 4 — distribution (R2 / cdn.comprom.org)

- [ ] **T4.1** `r2-cors.json` (GET `*`) + `wrangler.jsonc` R2 binding;
  document the one-time bucket + custom-domain + CORS setup. Ref §9.
- [ ] **T4.2** CI: GitHub Actions on push to master → build → upload
  artifacts to R2 with correct Content-Type + Cache-Control. Ref §9.
  _(Blocked on: R2 bucket created + custom domain attached + a CF
  token with R2 scope — owner action; the `.env` token won't work.)_

## Phase 5 — wire-up & docs

- [ ] **T5.1** Embed `<revint-webring>` on comprom.org (public-website
  footer or a dedicated spot) pointing at `cdn.comprom.org`. Separate
  PR in public-website.
- [ ] **T5.2** README: embed snippet, theming API, how to edit
  `members.json`, how partners join the ring.

## Notes / sequencing

- Phases 1–3 are fully local and unblock immediately (TDD).
- Phase 4 deploy is **blocked** on owner-side R2 infra (bucket +
  custom domain + R2-scoped token).
- Phase 5 embed is a follow-up once the CDN serves the bundle.
- Out of scope (separate initiative the owner raised): migrating
  heavy media (newspaper PDF/FB2, covers) from the public-website
  bundle to R2.
