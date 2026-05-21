/**
 * Default Shadow DOM styles. Headless-with-defaults: the component
 * looks finished out of the box, but every visual is themeable via
 * `--revint-*` custom properties, the host can target `::part(button)`,
 * and the label is a `<slot>`. Reduced-motion is honoured.
 *
 * Default palette meets WCAG AA (white text on the accent #b3231d:
 * contrast ≈ 5.9:1).
 */
export const STYLES = /* css */ `
  :host {
    --revint-accent: #b3231d;
    --revint-accent-hover: #8f1a16;
    --revint-fg: #ffffff;
    --revint-radius: 0.5rem;
    --revint-font: inherit;
    display: inline-block;
  }

  .button {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    min-height: 44px;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: var(--revint-radius);
    background: var(--revint-accent);
    color: var(--revint-fg);
    font: var(--revint-font);
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.15s ease;
  }

  .button:hover:not(:disabled) {
    background: var(--revint-accent-hover);
  }

  .button:focus-visible {
    outline: 3px solid var(--revint-accent);
    outline-offset: 2px;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .icon {
    flex-shrink: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .button {
      transition: none;
    }
  }
`
