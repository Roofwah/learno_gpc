import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'learno GPC – Repco & NAPA',
  description: 'Interactive kiosk experience for GPC branch managers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
