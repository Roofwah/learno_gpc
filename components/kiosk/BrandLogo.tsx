'use client'

import { resolveKioskLocalSrc } from '@/lib/kiosk-local-assets'
import type { Brand } from '@/lib/locations-build'

type BrandLike = Brand | string

export const BRAND_ACCENT: Record<string, string> = {
  REPCO: '#E4002B',
  NAPA: '#003087',
  GPC: '#ffc836',
  MSP: '#2E7D8A',
  /** @deprecated use GPC */
  HEAD_OFFICE: '#ffc836',
}

const BRAND_LOGOS: Partial<Record<string, { src: string; alt: string }>> = {
  REPCO: { src: '/Repco_logo.svg', alt: 'Repco' },
  NAPA: { src: '/NAPA_logo.svg', alt: 'NAPA' },
  GPC: { src: '/GPC_logo.svg', alt: 'GPC' },
}

const FALLBACK_LABEL: Record<string, string> = {
  MSP: 'MSP',
  HEAD_OFFICE: 'GPC',
}

export function hasBrandLogo(brand: BrandLike): brand is 'REPCO' | 'NAPA' | 'GPC' {
  return brand === 'REPCO' || brand === 'NAPA' || brand === 'GPC'
}

interface Props {
  brand: BrandLike
  className?: string
  imgClassName?: string
}

export default function BrandLogo({ brand, className = '', imgClassName }: Props) {
  const key = brand === 'HEAD_OFFICE' ? 'GPC' : brand
  const logo = BRAND_LOGOS[key]
  if (logo) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveKioskLocalSrc(logo.src)}
          alt={logo.alt}
          className={imgClassName ?? 'h-10 w-auto max-w-[160px] object-contain'}
        />
      </span>
    )
  }

  return (
    <span className={`font-black tracking-widest text-white ${className}`}>
      {FALLBACK_LABEL[key] ?? key}
    </span>
  )
}

interface BrandPillProps {
  brand: BrandLike
  className?: string
  imgClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Logo/text badge: dark glass pill + brand-colour border & glow */
export function BrandPill({ brand, className = '', imgClassName, size = 'md' }: BrandPillProps) {
  const key = brand === 'HEAD_OFFICE' ? 'GPC' : brand
  const accent = BRAND_ACCENT[key] ?? '#888888'
  const sizeClass = size === 'sm' ? 'brand-pill--sm' : size === 'lg' ? 'brand-pill--lg' : 'brand-pill--md'

  return (
    <div
      className={`brand-pill ${sizeClass} ${className}`}
      style={{ ['--brand-accent' as string]: accent }}
    >
      <BrandLogo brand={key} imgClassName={imgClassName} />
    </div>
  )
}
