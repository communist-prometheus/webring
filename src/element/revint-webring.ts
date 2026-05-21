import bundled from '../../members.json'
import { eligible } from '../core/eligible'
import { loadMembers } from '../core/load'
import type { Member, MembersDoc } from '../core/members'
import { pickRandom } from '../core/pick'
import { labelFor } from './i18n'
import { STYLES } from './styles'

/** Canonical members list URL; overridable via the `src` attribute. */
const DEFAULT_SRC = 'https://cdn.comprom.org/members.json'

const RING_ICON = /* svg */ `
  <svg class="icon" part="icon" width="16" height="16" viewBox="0 0 16 16"
       aria-hidden="true" focusable="false">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor"
            stroke-width="2"/>
    <circle cx="8" cy="2" r="2" fill="currentColor"/>
  </svg>`

/**
 * `<revint-webring>` — headless webring control. One button that
 * sends the visitor to a uniformly-random allied site whose origin
 * differs from the current page. Loads members from `src` (default
 * `cdn.comprom.org/members.json`) and falls back to the bundled list.
 *
 * Attributes:
 *  - `src`  — override the members JSON URL.
 *  - `lang` — pick the built-in label locale (slot overrides this).
 *
 * Theming: `::part(button)`, `::part(icon)`, and `--revint-*` custom
 * properties. Default slot replaces the label text.
 */
export class RevintWebring extends HTMLElement {
  static readonly observedAttributes = ['src', 'lang']

  readonly #button: HTMLButtonElement
  #pool: readonly Member[] = []

  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = STYLES
    this.#button = document.createElement('button')
    this.#button.type = 'button'
    this.#button.className = 'button'
    this.#button.setAttribute('part', 'button')
    this.#button.innerHTML = `${RING_ICON}<slot>${labelFor(this.getAttribute('lang'))}</slot>`
    this.#button.addEventListener('click', this.#onClick)
    root.append(style, this.#button)
    this.#setAvailable(false) // disabled until members load
  }

  connectedCallback(): void {
    void this.#init()
  }

  attributeChangedCallback(name: string): void {
    if (name === 'lang') {
      const slot = this.#button.querySelector('slot')
      if (slot && slot.assignedNodes().length === 0)
        slot.textContent = labelFor(this.getAttribute('lang'))
    }
    if (name === 'src' && this.isConnected) void this.#init()
  }

  async #init(): Promise<void> {
    const members = await loadMembers({
      fetchFn: globalThis.fetch.bind(globalThis),
      srcUrl: this.getAttribute('src') ?? DEFAULT_SRC,
      bundled: bundled as MembersDoc,
    })
    this.#pool = eligible(members, globalThis.location.origin)
    this.#setAvailable(this.#pool.length > 0)
  }

  #setAvailable(available: boolean): void {
    this.#button.disabled = !available
    this.#button.setAttribute('aria-disabled', String(!available))
  }

  readonly #onClick = (): void => {
    const target = pickRandom(this.#pool, Math.random)
    if (target) globalThis.location.assign(target.url)
  }
}

/** Register the element once; safe to import more than once. */
export const define = (tag = 'revint-webring'): void => {
  if (!customElements.get(tag)) customElements.define(tag, RevintWebring)
}
