/**
 * Build public/data/stores.json from data/stores.csv (preferred) or embedded raw data.
 *
 * CSV columns: displayName,suburb,state,country,direct
 * country = AU or NZ
 * direct = yes (optional) — one-tap choice, no state/suburb steps; suburb/state may be empty
 *
 * Usage: npm run build-stores
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { buildAllLocations, type RawStoreRow } from '../lib/locations-build'
import { RAW_AU, RAW_NZ } from '../lib/stores-raw'

const ROOT = join(__dirname, '..')
const CSV_PATH = join(ROOT, 'data', 'stores.csv')
const OUT_PATH = join(ROOT, 'public', 'data', 'stores.json')

function parseCsv(content: string): RawStoreRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'))
  if (lines.length < 2) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const nameIdx = header.indexOf('displayname')
  const suburbIdx = header.indexOf('suburb')
  const stateIdx = header.indexOf('state')
  const countryIdx = header.indexOf('country')
  const directIdx = header.indexOf('direct')
  if (nameIdx === -1 || suburbIdx === -1 || stateIdx === -1) {
    throw new Error('stores.csv must have columns: displayName, suburb, state, country')
  }

  const rows: RawStoreRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    if (cols.length < 3) continue
    const displayName = cols[nameIdx]
    const suburb = cols[suburbIdx] ?? ''
    const state = cols[stateIdx] ?? ''
    const country = (countryIdx >= 0 ? cols[countryIdx] : 'AU').toUpperCase() as 'AU' | 'NZ'
    const directRaw = directIdx >= 0 ? cols[directIdx]?.toLowerCase() : ''
    const direct = directRaw === 'yes' || directRaw === 'y' || directRaw === '1' || directRaw === 'true'
    if (!displayName) continue
    if (!direct && (!suburb || !state)) continue
    rows.push({ displayName, suburb, state, country, direct: direct || undefined })
  }
  return rows
}

function rawTuplesToRows(au: [string, string, string][], nz: [string, string, string][]): RawStoreRow[] {
  return [
    ...au.map(([displayName, suburb, state]) => ({ displayName, suburb, state, country: 'AU' as const })),
    ...nz.map(([displayName, suburb, state]) => ({ displayName, suburb, state, country: 'NZ' as const })),
  ]
}

function main() {
  let rows: RawStoreRow[]
  if (existsSync(CSV_PATH)) {
    rows = parseCsv(readFileSync(CSV_PATH, 'utf8'))
    console.log(`[build-stores] Loaded ${rows.length} rows from data/stores.csv`)
  } else {
    rows = rawTuplesToRows(RAW_AU, RAW_NZ)
    console.log(`[build-stores] No data/stores.csv — using embedded raw (${rows.length} rows)`)
  }

  const data = buildAllLocations(rows)
  const storeCount = data.regions.reduce(
    (n, s) => n + s.suburbs.reduce((m, sub) => m + sub.stores.length, 0),
    0
  )

  mkdirSync(join(ROOT, 'public', 'data'), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(data, null, 2), 'utf8')
  console.log(`[build-stores] Wrote ${OUT_PATH}`)
  console.log(
    `[build-stores] ${data.regions.length} regions, ${storeCount} stores, ${data.direct.length} direct choice(s)`
  )
}

main()
