/** One-time export: embedded raw → data/stores.csv for editing */
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { RAW_AU, RAW_NZ } from '../lib/stores-raw'

const lines = ['displayName,suburb,state,country']
for (const [name, suburb, state] of RAW_AU) {
  lines.push(`${name},${suburb},${state},AU`)
}
for (const [name, suburb, state] of RAW_NZ) {
  lines.push(`${name},${suburb},${state},NZ`)
}

const out = join(__dirname, '..', 'data', 'stores.csv')
mkdirSync(join(__dirname, '..', 'data'), { recursive: true })
writeFileSync(out, lines.join('\n') + '\n', 'utf8')
console.log(`Wrote ${lines.length - 1} rows to ${out}`)
