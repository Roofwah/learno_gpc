import fs from 'fs'
import path from 'path'
import { timingSafeEqual } from 'crypto'

const PIN_FILE = path.join(process.cwd(), 'campaign-reset-pin.txt')
const DEFAULT_PIN = '4321'

/** PIN for “Reset campaign” — override via campaign-reset-pin.txt or GPC_RESET_PIN. */
export function getCampaignResetPin(): string {
  if (fs.existsSync(PIN_FILE)) {
    const fromFile = fs.readFileSync(PIN_FILE, 'utf8').trim()
    if (fromFile) return fromFile
  }
  const fromEnv = process.env.GPC_RESET_PIN?.trim()
  if (fromEnv) return fromEnv
  return DEFAULT_PIN
}

export function verifyCampaignResetPin(submitted: unknown): boolean {
  const expected = getCampaignResetPin()
  const a = Buffer.from(String(submitted ?? '').trim())
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    timingSafeEqual(b, b)
    return false
  }
  return timingSafeEqual(a, b)
}
