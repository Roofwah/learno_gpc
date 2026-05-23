import type { Participant } from './socket-types'
import type { Brand } from './locations-build'

export type CorporateRole = 'HEAD_OFFICE' | 'AREA_MANAGER' | 'STORE_OTHER'
export type Department = 'REPCO' | 'NAPA' | 'GPC'
export type CorpCountry = 'AU' | 'NZ'

export const CORPORATE_ROLES: { id: CorporateRole; label: string }[] = [
  { id: 'HEAD_OFFICE', label: 'Head Office' },
  { id: 'AREA_MANAGER', label: 'Area Manager' },
  { id: 'STORE_OTHER', label: 'Store Other' },
]

/** One tap: brand + country, then into the game */
export const CORP_LOCATION_PICKS: {
  department: Department
  country: CorpCountry
  label: string
}[] = [
  { department: 'NAPA', country: 'AU', label: 'NAPA AUST' },
  { department: 'NAPA', country: 'NZ', label: 'NAPA NEW ZEALAND' },
  { department: 'REPCO', country: 'AU', label: 'REPCO AUSTRALIA' },
  { department: 'REPCO', country: 'NZ', label: 'REPCO NEW ZEALAND' },
  { department: 'GPC', country: 'AU', label: 'GPC AUSTRALIA' },
  { department: 'GPC', country: 'NZ', label: 'GPC NEW ZEALAND' },
]

export function buildCorporateParticipant(
  playerName: string,
  role: CorporateRole,
  department: Department,
  country: CorpCountry
): Participant {
  const region = country === 'AU' ? 'AUSTRALIA' : 'NEW ZEALAND'
  const roleLabel = CORPORATE_ROLES.find((r) => r.id === role)?.label ?? role
  return {
    name: playerName,
    storeName: `${department} ${roleLabel} ${region}`,
    storeId: `CORP-${role}-${department}-${country}`,
    state: country,
    suburb: role,
    brand: department as Brand,
  }
}
