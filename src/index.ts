import { define } from './element/revint-webring'

export { RevintWebring, define } from './element/revint-webring'

// Auto-register on import so a plain `<script src>` embed works with
// zero host code beyond the tag itself.
define()
