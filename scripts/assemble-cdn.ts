import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Assemble the `cdn-dist/` directory that the `webring-cdn` Worker
 * (wrangler.jsonc → assets.directory) deploys to `cdn.comprom.org`:
 * the built bundle + the canonical members list + the CORS headers.
 *
 * Run after `vite build`. Kept dumb on purpose — no transform, just
 * collect the three deployable artifacts in one place.
 */
const root = resolve(import.meta.dirname, '..')
const out = resolve(root, 'cdn-dist')

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
cpSync(resolve(root, 'dist/webring.js'), resolve(out, 'webring.js'))
cpSync(resolve(root, 'members.json'), resolve(out, 'members.json'))
cpSync(resolve(root, 'cdn/_headers'), resolve(out, '_headers'))

process.stdout.write('[assemble-cdn] cdn-dist ready\n')
