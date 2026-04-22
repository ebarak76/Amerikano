const COLORS = [
  ['bg-red-500', 'text-white'],
  ['bg-blue-500', 'text-white'],
  ['bg-emerald-500', 'text-white'],
  ['bg-amber-500', 'text-white'],
  ['bg-purple-500', 'text-white'],
  ['bg-pink-500', 'text-white'],
  ['bg-cyan-500', 'text-white'],
  ['bg-orange-500', 'text-white'],
  ['bg-indigo-500', 'text-white'],
  ['bg-teal-500', 'text-white'],
  ['bg-rose-500', 'text-white'],
  ['bg-violet-500', 'text-white'],
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

interface Props {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ name, size = 'md' }: Props) {
  const colorIndex = hashName(name) % COLORS.length
  const [bg, text] = COLORS[colorIndex]
  const initial = name.charAt(0).toUpperCase()

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }

  return (
    <div className={`${sizeClasses[size]} ${bg} ${text} rounded-full flex items-center justify-center font-bold shrink-0 shadow-sm`}>
      {initial}
    </div>
  )
}
