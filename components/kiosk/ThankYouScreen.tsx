'use client'

import { resolveSlideImageSrc } from '@/lib/kiosk-local-assets'

/** Short thank-you card shown once after session leaderboard (slide_05) */
export default function ThankYouScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveSlideImageSrc(4)}
        alt="Thank you"
        className="w-full h-full object-contain"
      />
    </div>
  )
}
