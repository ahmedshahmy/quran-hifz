/**
 * Bundles scripts/tests.mjs (plus the TypeScript modules it imports) with
 * esbuild, then runs the bundle on Node. Keeping the maths tests dependency-free
 * means `pnpm test` works in CI without a test framework.
 */
import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

const root = path.resolve(import.meta.dirname, '..')
const outfile = path.join(root, 'scripts', '.tmp-tests.mjs')

await build({
  entryPoints: [path.join(root, 'scripts', 'tests.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
})

try {
  execFileSync(process.execPath, [outfile], { stdio: 'inherit' })
} finally {
  fs.rmSync(outfile, { force: true })
}
