import { createClient } from '@supabase/supabase-js'

// Supabase bağlantısı. Bu değerler tarayıcıya açık gönderildiği için gizli
// değildir; güvenlik sınırı Supabase'deki RLS izinleridir. Doğrudan koda
// yazılıyorlar ki uygulama, dağıtım ortamının (Vercel) env değişkenlerine
// bağlı kalmadan her zaman doğru projeye bağlansın.
const SUPABASE_URL = 'https://digtvkprskpgiprzwptw.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZ3R2a3Byc2twZ2lwcnp3cHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODY3MTQsImV4cCI6MjA4OTM2MjcxNH0.CWUWdcCTUA9_cfC6mFAkglI5AG6zHJAuG_w9KpOdBh8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
