import { useNavigate } from 'react-router-dom'

export default function Header({ title, back, subtitle }: { title: string; back?: string; subtitle?: string }) {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white px-4 pt-[max(env(safe-area-inset-top),12px)] pb-4 sticky top-0 z-10 shadow-lg shadow-emerald-900/20">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(back)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 active:bg-white/25 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          {subtitle && <p className="text-emerald-200 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
