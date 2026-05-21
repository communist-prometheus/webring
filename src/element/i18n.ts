/**
 * Built-in default labels for the control, keyed by the 2-letter
 * prefix of the host's `lang` attribute. Hosts can always override the
 * text via the element's default slot, so this table only needs to
 * cover the ring's own locales with a sensible neutral fallback.
 */
const LABELS: Readonly<Record<string, string>> = {
  en: 'Random allied site',
  ru: 'Случайный сайт кольца',
  it: 'Sito alleato a caso',
  es: 'Sitio aliado al azar',
  uk: 'Випадковий сайт кільця',
  pl: 'Losowa zaprzyjaźniona strona',
  bg: 'Случаен съюзен сайт',
}

/** Neutral default used when `lang` is absent or unknown. */
export const DEFAULT_LABEL = LABELS['en'] as string

/**
 * Resolve the control label for a `lang` attribute value.
 * @param lang - The element's `lang` attribute (e.g. `uk`, `ru-RU`).
 * @returns The localised label, or the neutral default.
 */
export const labelFor = (lang: string | null): string => {
  if (!lang) return DEFAULT_LABEL
  return LABELS[lang.slice(0, 2).toLowerCase()] ?? DEFAULT_LABEL
}
