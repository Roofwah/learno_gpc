'use client'

interface Props {
  value: string
  onChange: (v: string) => void
  maxLength?: number
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

export default function OnscreenNumericKeypad({ value, onChange, maxLength = 8 }: Props) {
  const press = (digit: string) => {
    if (value.length >= maxLength) return
    onChange(value + digit)
  }

  const backspace = () => onChange(value.slice(0, -1))
  const clear = () => onChange('')

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="grid grid-cols-3 gap-2 w-full max-w-[320px]">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              press(d)
            }}
            className="kb-key h-[72px] text-3xl font-bold"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            clear()
          }}
          className="kb-key h-[72px] text-lg"
        >
          Clear
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            press('0')
          }}
          className="kb-key h-[72px] text-3xl font-bold"
        >
          0
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault()
            backspace()
          }}
          className="kb-key h-[72px] text-xl"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
