import { Link } from 'react-router-dom'

/**
 * Silinmiş bir sezona/maça ait eski bir bağlantı (yer imi, PWA önbelleği,
 * paylaşılmış link) açıldığında çıkmaz sayfa kalmasın diye ana sayfaya
 * dönüş sunar.
 */
export default function NotFound({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-navy-50 p-8 text-center">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#b8c7e2" strokeWidth="1.6" strokeLinecap="round" className="mb-4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v5M12 16.5h.01" />
      </svg>
      <p className="text-navy-600 text-sm font-bold">{message}</p>
      <p className="text-navy-400 text-xs mt-1.5">Silinmiş veya taşınmış olabilir.</p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-2 bg-navy-800 text-white px-5 py-3 rounded-2xl text-sm font-bold active:scale-[0.97] transition-transform"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
        Ana sayfaya dön
      </Link>
    </div>
  )
}
