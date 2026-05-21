# `@communist-prometheus/webring`

Headless web component for the **Revolutionary Internationalists**
webring. One button — it sends the visitor to a uniformly-random
allied site whose origin differs from the current page.

- **Framework-agnostic** custom element — works on any site.
- **Headless with default styles** — looks finished out of the box,
  fully themeable.
- **No tracking, no storage, no server calls back to us.** Members are
  fetched from a public JSON; the bundled copy is the fallback.
- ~2 kB gzipped, zero runtime dependencies.

## Embed

Add the script and the element where you want the control:

```html
<script type="module" src="https://cdn.comprom.org/webring.js"></script>

<revint-webring></revint-webring>
```

That's it. Clicking the button navigates to a random member site.

### Attributes

| Attribute | Default | Purpose |
|-----------|---------|---------|
| `src`  | `https://cdn.comprom.org/members.json` | Override the members list URL. |
| `lang` | (host `lang`) | Selects the built-in button label locale (`en`, `ru`, `it`, `es`, `uk`, `pl`, `bg`). The slot overrides this. |

```html
<revint-webring lang="ru"></revint-webring>
```

## Theming

The component uses Shadow DOM, so its styles never leak in or out.
Customise without forking:

### CSS custom properties

```css
revint-webring {
  --revint-accent: #b3231d;        /* button background */
  --revint-accent-hover: #8f1a16;
  --revint-fg: #ffffff;            /* button text */
  --revint-radius: 0.5rem;
  --revint-font: inherit;
}
```

### `::part()`

```css
revint-webring::part(button) { /* full control of the button box */ }
revint-webring::part(icon)   { /* the ring glyph */ }
```

### Replace the label

The default slot is the button text:

```html
<revint-webring>🎲 Surprise me</revint-webring>
```

## Behaviour

- Picks **uniformly at random** among members whose origin differs
  from the current page (never sends you to the site you're on).
- If the ring has no eligible member (e.g. you're the only site), the
  button is **disabled** (`aria-disabled`).
- Loads members from `src`; on **any** failure (network, CORS,
  non-2xx, malformed, empty) it silently uses the **bundled** list.
  A broken list can never break your page.
- Accessible: real `<button>`, keyboard-operable, WCAG-AA default
  contrast, honours `prefers-reduced-motion`.

### Why no "sites you haven't visited yet"?

Browsers deliberately make cross-site visit history unreadable
(`:visited` is unreadable from script; `localStorage` is per-origin;
reading visit state via layout tricks is history-sniffing and is
blocked). There is no privacy-safe way to know which ring sites you've
been to from another site — so the ring stays honestly random.

## Join the ring

The ring is a single JSON file
([`members.json`](./members.json)), served from
`cdn.comprom.org/members.json`:

```jsonc
{
  "ring": "revolutionary-internationalists",
  "members": [
    { "url": "https://your-site.org/", "name": "Your Organisation",
      "lang": "en", "description": "Short description." }
  ]
}
```

`url` and `name` are required; `lang` and `description` are optional.
Open a PR adding your entry, then embed the snippet above on your site.

## Develop

```sh
bun install
bun run test        # vitest — pure core
bun run test:e2e    # playwright — the element in a real browser
bun run build       # validate members → typecheck → single dist/webring.js
```

Architecture: a pure functional core (`src/core`, no DOM, all deps
injected) under a thin custom-element shell (`src/element`). See
[`specs/webring/`](./specs/webring) for the requirements / design /
tasks.
