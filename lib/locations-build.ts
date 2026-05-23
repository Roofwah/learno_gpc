export type Brand = 'REPCO' | 'NAPA' | 'GPC' | 'MSP'

export interface Store {
  id: string
  name: string
  brand: Brand
  suburb: string
  state: string
  country: 'AU' | 'NZ'
}

export interface SuburbGroup {
  suburb: string
  stores: Store[]
}

export interface StateGroup {
  state: string
  code: string
  country: 'AU' | 'NZ'
  suburbs: SuburbGroup[]
}

export interface RawStoreRow {
  displayName: string
  suburb: string
  state: string
  country: 'AU' | 'NZ'
  /** No region drill-down — one-tap on registration */
  direct?: boolean
}

export interface StoresData {
  regions: StateGroup[]
  direct: Store[]
}

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales',
  ACT: 'ACT',
  VIC: 'Victoria',
  QLD: 'Queensland',
  SA: 'South Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  WA: 'Western Australia',
  NI: 'North Island (NZ)',
  SI: 'South Island (NZ)',
}

const STATE_ORDER = ['NSW', 'ACT', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'NI', 'SI']

function detectBrand(name: string): Brand {
  if (name.startsWith('REPCO')) return 'REPCO'
  if (name.startsWith('NAPA')) return 'NAPA'
  if (name.startsWith('GPC')) return 'GPC'
  if (name.startsWith('MSP')) return 'MSP'
  return 'REPCO'
}

function rowToStore(row: RawStoreRow, id: string): Store {
  return {
    id,
    name: row.displayName,
    brand: detectBrand(row.displayName),
    suburb: row.suburb,
    state: row.state,
    country: row.country,
  }
}

function buildDirectStores(rows: RawStoreRow[]): Store[] {
  return rows
    .filter((r) => r.direct)
    .map((row, i) => rowToStore(row, `DIR-${slug(row.displayName)}-${i + 1}`))
}

function slug(s: string): string {
  return s.replace(/[^A-Z0-9]/gi, '_').toUpperCase()
}

function dedupeRows(rows: RawStoreRow[]): RawStoreRow[] {
  return rows.filter(
    (r, i, arr) =>
      arr.findIndex(
        (x) =>
          x.displayName === r.displayName &&
          x.suburb === r.suburb &&
          x.state === r.state &&
          x.country === r.country
      ) === i
  )
}

function buildLocations(rows: RawStoreRow[], country: 'AU' | 'NZ'): StateGroup[] {
  const byState = new Map<string, RawStoreRow[]>()
  for (const r of rows) {
    if (r.country !== country) continue
    if (!byState.has(r.state)) byState.set(r.state, [])
    byState.get(r.state)!.push(r)
  }

  const stateKeys = [...byState.keys()].sort((a, b) => {
    const ia = STATE_ORDER.indexOf(a)
    const ib = STATE_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  return stateKeys.map((stateCode) => {
    const stateRows = byState.get(stateCode)!
    const bySuburb = new Map<string, RawStoreRow[]>()
    for (const r of stateRows) {
      if (!bySuburb.has(r.suburb)) bySuburb.set(r.suburb, [])
      bySuburb.get(r.suburb)!.push(r)
    }

    const suburbs: SuburbGroup[] = [...bySuburb.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([suburb, sRows]) => ({
        suburb,
        stores: sRows.map((row, i) => {
          const brand = detectBrand(row.displayName)
          const prefix =
            brand === 'REPCO' ? 'REP' : brand === 'NAPA' ? 'NAP' : brand === 'GPC' ? 'GPC' : 'MSP'
          const idBase = `${prefix}-${row.state}-${slug(suburb)}`
          const sameKey = sRows.filter(
            (r) => r.suburb === suburb && detectBrand(r.displayName) === brand
          )
          const idx = sameKey.indexOf(sRows[i])
          const id = sameKey.length > 1 ? `${idBase}_${idx + 1}` : idBase
          return {
            id,
            name: row.displayName,
            brand,
            suburb: row.suburb,
            state: row.state,
            country,
          }
        }),
      }))

    return {
      state: STATE_NAMES[stateCode] ?? stateCode,
      code: stateCode,
      country,
      suburbs,
    }
  })
}

export function buildAllLocations(rows: RawStoreRow[]): StoresData {
  const deduped = dedupeRows(rows)
  const regional = deduped.filter((r) => !r.direct)
  return {
    regions: [...buildLocations(regional, 'AU'), ...buildLocations(regional, 'NZ')],
    direct: buildDirectStores(deduped),
  }
}
