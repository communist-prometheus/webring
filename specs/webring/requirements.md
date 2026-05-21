# Webring «Революционные интернационалисты» — Requirements

Tracks: communist-prometheus/tickets#22

## Overview

A privacy-respecting **webring** for the "Revolutionary
Internationalists" — a set of allied proletarian-internationalist
sites that link to one another in a ring. It ships as a
**framework-agnostic, headless web component** (custom element) with
**sensible default styles**, that any member site embeds with one
script tag and one element. Its single visible action — **"Random
site"** — sends the visitor to another ring member whose origin
differs from the current page, chosen **uniformly at random**.

The ring is built from **one source JSON file** that lists members
(the single source of truth). The component **fetches** that list from
a canonical URL and **falls back to a bundled copy** if the fetch
fails.

### Design decisions (locked with owner 2026-05-21)

- **Selection = always uniform random** among eligible members. No
  visit-preference, no "unvisited first / least-recently-visited".
  Rationale: cross-origin visit history cannot be read in a
  privacy-safe way (`:visited` is unreadable from JS by design;
  `localStorage` is origin-scoped; reading `:visited` via layout
  tricks is history-sniffing and is blocked). The owner chose to drop
  the preference entirely — simpler and zero tracking.
- **No storage, no tracking.** The component persists nothing and
  sends nothing. (`:visited` styling — purely the browser's own visual
  cue on any rendered links — is allowed since it needs no JS and
  leaks nothing to us.)
- **Headless + default styles.** Behaviour is decoupled from
  presentation; the component renders usable default styling out of
  the box but exposes hooks (CSS parts, custom properties, slots) for
  full host override.
- **New repo** `communist-prometheus/webring`; element
  `<revint-webring>`.
- **Hosting** on `cdn.comprom.org` — both the component bundle and its
  styles, plus the canonical members JSON.

### Non-goals (v1)

- No prev/next navigation — the only control is "Random site".
- No server, no analytics, no account, no cross-origin tracking, no
  local storage.
- No member self-service signup — the member list is edited in the
  JSON file by a maintainer.

## User stories & acceptance criteria

Acceptance criteria use EARS notation. Each maps to a test.

### US-1 — Jump to a random member

*As a visitor, I want one click to take me to another ring site so I
can discover allied organisations.*

- **AC-1.1** WHEN the visitor activates the "Random site" control THE
  SYSTEM SHALL navigate the top-level browsing context to a member URL
  whose **origin differs** from the current page's origin, chosen
  **uniformly at random** among eligible members.
- **AC-1.2** "Eligible" SHALL mean: present in the member list AND
  origin ≠ current page origin.
- **AC-1.3** IF there are zero eligible members (ring of one / empty
  list) THEN THE SYSTEM SHALL render a disabled / "ring unavailable"
  state and SHALL NOT navigate.
- **AC-1.4** THE SYSTEM SHALL never navigate to a URL not present in
  the member list.

### US-2 — Member list: fetch with fallback

*As a ring maintainer, I want one canonical list, with the component
resilient to fetch failure.*

- **AC-2.1** THE SYSTEM SHALL derive the ring from a single JSON file
  whose entries carry at least `url` and `name`, with optional `lang`
  and `description`.
- **AC-2.2** WHEN the component initialises THE SYSTEM SHALL attempt to
  **fetch** the members JSON from the canonical URL (default, or a
  host-supplied `src` attribute).
- **AC-2.3** WHERE the fetch fails (network, CORS, non-2xx, malformed)
  THE SYSTEM SHALL fall back to the **bundled** members list and SHALL
  NOT throw or break the host page.
- **AC-2.4** WHERE an individual member entry is malformed (missing
  url/name, unparseable URL) THE SYSTEM SHALL skip that entry rather
  than discard the whole list.
- **AC-2.5** THE build SHALL validate the bundled JSON (well-formed
  URLs, unique origins, required fields) and fail the build on
  violation.

### US-3 — Trivial embed, framework-agnostic, headless+default

*As a member-site owner, I want to add the ring with minimal code and
optionally restyle it.*

- **AC-3.1** THE SYSTEM SHALL be usable by adding one `<script>` tag
  (the built bundle from `cdn.comprom.org`) and one custom element,
  `<revint-webring></revint-webring>`.
- **AC-3.2** THE SYSTEM SHALL require **no** framework or build step on
  the host page.
- **AC-3.3** THE SYSTEM SHALL render usable **default styling** with
  zero configuration.
- **AC-3.4** THE SYSTEM SHALL encapsulate styles via Shadow DOM so it
  neither leaks CSS into nor unexpectedly inherits CSS from the host.
- **AC-3.5** THE SYSTEM SHALL expose presentation hooks for host
  override: CSS `::part()` on the control, themeable CSS custom
  properties, and a slot to replace the control's label/content.
- **AC-3.6** THE SYSTEM SHALL accept an optional `src` attribute to
  override the canonical members-JSON URL.

### US-4 — Accessible control

*As a keyboard / screen-reader user, I want the ring usable.*

- **AC-4.1** THE control SHALL be a real, focusable `<button>` operable
  by keyboard (Enter/Space) with a descriptive accessible name.
- **AC-4.2** THE disabled / unavailable state SHALL be conveyed to
  assistive tech (`disabled` / `aria-disabled`, removed from or kept
  in tab order appropriately).
- **AC-4.3** Default colours SHALL meet WCAG AA contrast against the
  component's own background.
- **AC-4.4** THE component SHALL respect `prefers-reduced-motion` for
  any transition/animation in the default styles.

## Resolved questions

1. Element `<revint-webring>`, repo `communist-prometheus/webring` — ✅.
2. Members JSON: **fetch** canonical URL, **fallback to bundled** — ✅.
3. Origin granularity for the "different origin" check — ✅.
4. Hosting on `cdn.comprom.org` (bundle + styles + members JSON) — ✅.
5. Selection strategy: **always uniform random** (no visit
   preference, no storage) — ✅.
