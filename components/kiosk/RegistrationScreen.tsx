'use client'
import { useEffect, useMemo, useState } from 'react'
import { loadLocations, getStates, getSuburbs, getStores } from '@/lib/locations'
import type { Store, StateGroup } from '@/lib/locations'
import {
  CORPORATE_ROLES,
  CORP_LOCATION_PICKS,
  buildCorporateParticipant,
  type CorporateRole,
  type Department,
  type CorpCountry,
} from '@/lib/corporate-registration'
import { BrandPill, BRAND_ACCENT } from '@/components/kiosk/BrandLogo'
import type { Participant } from '@/lib/socket-types'

interface Props {
  playerName: string
  onComplete: (participant: Participant) => void
  onBack: () => void
}

type Step = 'state' | 'suburb' | 'store' | 'corp-location'

export default function RegistrationScreen({ playerName, onComplete, onBack }: Props) {
  const [step, setStep] = useState<Step>('state')
  const [corporateRole, setCorporateRole] = useState<CorporateRole | null>(null)
  const [selectedState, setSelectedState] = useState('')
  const [selectedSuburb, setSelectedSuburb] = useState('')
  const [locations, setLocations] = useState<StateGroup[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [storesError, setStoresError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadLocations()
      .then((data) => {
        if (!cancelled) setLocations(data.regions)
      })
      .catch((err: Error) => {
        if (!cancelled) setStoresError(err.message ?? 'Could not load store list')
      })
      .finally(() => {
        if (!cancelled) setLoadingStores(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const states = locations.length > 0 ? locations : getStates()
  const suburbs = selectedState ? getSuburbs(selectedState) : []
  const stores =
    selectedState && selectedSuburb ? getStores(selectedState, selectedSuburb) : []

  const handleStatePick = (code: string) => {
    setSelectedState(code)
    setSelectedSuburb('')
    setStep('suburb')
  }

  const handleSuburbPick = (suburb: string) => {
    setSelectedSuburb(suburb)
    const list = getStores(selectedState, suburb)
    if (list.length === 1) {
      completeWithStore(list[0], selectedState, suburb)
      return
    }
    setStep('store')
  }

  const completeWithStore = (store: Store, state: string, suburb: string) => {
    onComplete({
      name: playerName,
      storeName: store.name,
      storeId: store.id,
      state,
      suburb,
      brand: store.brand,
    })
  }

  const handleStorePick = (store: Store) => {
    completeWithStore(store, selectedState, selectedSuburb)
  }

  const handleCorporateRolePick = (role: CorporateRole) => {
    setCorporateRole(role)
    setStep('corp-location')
  }

  const handleCorpLocationPick = (department: Department, country: CorpCountry) => {
    if (!corporateRole) return
    onComplete(buildCorporateParticipant(playerName, corporateRole, department, country))
  }

  const goBack = () => {
    if (step === 'corp-location') {
      setCorporateRole(null)
      setStep('state')
    } else if (step === 'suburb') {
      setSelectedState('')
      setStep('state')
    } else if (step === 'store') {
      setStep('suburb')
    } else {
      onBack()
    }
  }

  const corpRoleLabel = useMemo(
    () => CORPORATE_ROLES.find((r) => r.id === corporateRole)?.label,
    [corporateRole]
  )

  if (loadingStores) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 gap-4">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <p className="text-white/50 text-xl">Loading stores…</p>
      </div>
    )
  }

  if (storesError || states.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/60 p-10 text-center gap-4">
        <p className="text-red-400 text-2xl font-bold">Store list unavailable</p>
        <p className="text-white/50 text-lg max-w-md">{storesError ?? 'No stores in data/stores.json'}</p>
        <button type="button" onPointerDown={onBack} className="text-white/60 text-xl mt-4">
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-black/60">
      <div className="flex items-center px-10 pt-10 pb-6 border-b border-white/10">
        <button type="button" onPointerDown={goBack} className="text-white/40 text-2xl hover:text-white/70">
          ← Back
        </button>
      </div>

      <div className="registration-content flex-1 flex flex-col px-10 min-h-0">
        {step === 'state' && (
          <div className="registration-step animate-fade-in flex flex-col min-h-0 flex-1">
            <p className="registration-intro shrink-0">
              Hi <span className="registration-intro-name">{playerName}</span>, please select your region
            </p>

            <div className="registration-scroll registration-scroll--grid grid grid-cols-2 gap-4 shrink-0">
              {states.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onPointerDown={() => handleStatePick(s.code)}
                  className="
                    flex flex-col items-start px-7 py-6 rounded-2xl text-left
                    bg-white/5 border border-white/10
                    hover:bg-white/10 hover:border-white/25
                    active:scale-95 transition-all duration-150
                  "
                >
                  <span className="text-[#E4002B] text-lg font-bold uppercase tracking-widest mb-1">
                    {s.country === 'NZ' ? '🇳🇿 NZ' : '🇦🇺 AU'} · {s.code}
                  </span>
                  <span className="text-white text-2xl font-semibold">{s.state}</span>
                  <span className="text-white/40 text-lg mt-1">
                    {s.suburbs.length} location{s.suburbs.length !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>

            <div className="my-8 h-px bg-white/15 shrink-0" />

            <div className="flex flex-col gap-3 pb-8 shrink-0">
              {CORPORATE_ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onPointerDown={() => handleCorporateRolePick(r.id)}
                  className="
                    px-7 py-5 rounded-2xl text-left
                    bg-white/5 border border-white/10
                    hover:bg-white/10 hover:border-white/25
                    active:scale-95 transition-all
                  "
                >
                  <span className="text-white text-2xl font-bold">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'corp-location' && (
          <div className="registration-step animate-fade-in">
            <p className="registration-intro">
              Hi <span className="registration-intro-name">{playerName}</span>, select your location
            </p>
            <p className="registration-intro-sub">{corpRoleLabel}</p>
            <div className="flex flex-col gap-3">
              {CORP_LOCATION_PICKS.map((pick) => (
                <button
                  key={`${pick.department}-${pick.country}`}
                  type="button"
                  onPointerDown={() => handleCorpLocationPick(pick.department, pick.country)}
                  className="
                    flex items-center gap-6 px-7 py-6 rounded-2xl text-left
                    bg-white/5 border border-white/10
                    hover:bg-white/10 active:scale-95 transition-all
                  "
                  style={{ borderColor: `${BRAND_ACCENT[pick.department]}44` }}
                >
                  <BrandPill
                    brand={pick.department}
                    size="sm"
                    imgClassName="h-10 w-auto object-contain"
                  />
                  <span className="text-white text-2xl font-bold">{pick.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'suburb' && (
          <div className="registration-step animate-fade-in">
            <button type="button" onPointerDown={() => setStep('state')} className="registration-back-link">
              ← Change region
            </button>
            <p className="registration-intro">
              Hi <span className="registration-intro-name">{playerName}</span>, please select your suburb
            </p>
            <p className="registration-intro-sub">
              {states.find((s) => s.code === selectedState)?.state}
            </p>
            <div className="registration-scroll-hint" aria-hidden="true">
              <span className="registration-scroll-hint-label">Scroll</span>
              <span className="registration-scroll-hint-icon">▼</span>
            </div>
            <div className="registration-scroll-wrap">
              <div className="registration-scroll flex flex-col gap-3">
                {suburbs.map((sb) => (
                  <button
                    key={sb.suburb}
                    type="button"
                    onPointerDown={() => handleSuburbPick(sb.suburb)}
                    className="
                      flex items-center justify-between px-7 py-6 rounded-2xl text-left
                      bg-white/5 border border-white/10
                      hover:bg-white/10 hover:border-white/25
                      active:scale-95 transition-all duration-150
                    "
                  >
                    <span className="text-white text-3xl font-semibold">{sb.suburb}</span>
                    <span className="text-white/40 text-xl">
                      {sb.stores.length} store{sb.stores.length !== 1 ? 's' : ''} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'store' && (
          <div className="registration-step animate-fade-in">
            <button type="button" onPointerDown={() => setStep('suburb')} className="registration-back-link">
              ← Change suburb
            </button>
            <p className="registration-intro">
              Hi <span className="registration-intro-name">{playerName}</span>, please select your store
            </p>
            <p className="registration-intro-sub">{selectedSuburb}</p>
            <div className="registration-scroll flex flex-col gap-4">
              {stores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onPointerDown={() => handleStorePick(store)}
                  className="
                    flex items-center gap-6 px-7 py-7 rounded-2xl text-left
                    bg-white/5 border border-white/10
                    hover:border-white/30 active:scale-95 transition-all duration-150
                  "
                  style={{ borderColor: `${BRAND_ACCENT[store.brand]}66` }}
                >
                  <BrandPill brand={store.brand} size="sm" imgClassName="h-11 w-auto object-contain" />
                  <div>
                    <div className="text-white text-3xl font-bold">{store.name}</div>
                    <div className="text-white/40 text-xl mt-1">
                      {store.suburb} · {store.state}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
