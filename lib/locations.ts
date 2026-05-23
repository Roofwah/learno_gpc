/**
 * Store list loaded at runtime from /data/stores.json
 * Update stores: edit data/stores.csv → npm run build-stores → copy public/data/stores.json to kiosks
 */
export type { Brand, Store, SuburbGroup, StateGroup, StoresData } from './locations-build'

import type { StateGroup, SuburbGroup, Store, StoresData } from './locations-build'

const STORES_URL = '/data/stores.json'

let cache: StoresData | null = null
let loadPromise: Promise<StoresData> | null = null

function normalizeStoresPayload(data: StateGroup[] | StoresData): StoresData {
  if (Array.isArray(data)) {
    return { regions: data, direct: [] }
  }
  return {
    regions: data.regions ?? [],
    direct: data.direct ?? [],
  }
}

export async function loadLocations(): Promise<StoresData> {
  if (cache) return cache
  if (loadPromise) return loadPromise

  loadPromise = fetch(STORES_URL, { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load stores (${res.status})`)
      return res.json() as Promise<StateGroup[] | StoresData>
    })
    .then((data) => {
      cache = normalizeStoresPayload(data)
      return cache
    })
    .finally(() => {
      loadPromise = null
    })

  return loadPromise
}

/** Clear cache (e.g. after hot-reload in dev) */
export function resetLocationsCache() {
  cache = null
  loadPromise = null
}

export function getStates(): StateGroup[] {
  return cache?.regions ?? []
}

export function getDirectStores(): Store[] {
  return cache?.direct ?? []
}

export function getSuburbs(stateCode: string): SuburbGroup[] {
  return getStates().find((s) => s.code === stateCode)?.suburbs ?? []
}

export function getStores(stateCode: string, suburb: string): Store[] {
  const state = getStates().find((s) => s.code === stateCode)
  return state?.suburbs.find((sb) => sb.suburb === suburb)?.stores ?? []
}
