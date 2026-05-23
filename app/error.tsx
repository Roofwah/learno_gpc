'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-black">Something went wrong</h1>
      <p className="text-white/50 text-center max-w-md">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-8 py-4 rounded-xl bg-[#E4002B] font-bold hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
