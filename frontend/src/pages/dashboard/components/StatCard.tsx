import { Users } from 'lucide-react'

// Warm Storybook: each brand colour maps to a section wash + matching ink stroke.
// wash-*/ink-* tokens switch automatically between light pastel and dark nebula tint,
// so no dark: variants are needed here.
const TINT: Record<string, { bg: string; icon: string }> = {
  'bg-kinder-blue': { bg: 'bg-wash-sky', icon: 'text-ink-sky' },
  'bg-kinder-purple': { bg: 'bg-wash-lavender', icon: 'text-ink-lavender' },
  'bg-kinder-green': { bg: 'bg-wash-mint', icon: 'text-ink-mint' },
  'bg-kinder-orange': { bg: 'bg-wash-peach', icon: 'text-ink-peach' },
  'bg-kinder-yellow': { bg: 'bg-wash-butter', icon: 'text-ink-butter' },
  'bg-kinder-pink': { bg: 'bg-wash-blush', icon: 'text-ink-blush' },
}

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: typeof Users
  label: string
  value: string | number
  color: string
  sub?: string
}) {
  const tint = TINT[color] ?? { bg: 'bg-gray-100 dark:bg-gray-800', icon: 'text-gray-500' }
  const fullLabel = sub ? `${label} ${sub}` : label

  return (
    <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-gray-900 rounded-3xl p-4 md:p-5 border-2 border-gray-200 dark:border-gray-800">
      <div
        className={`w-11 h-11 md:w-12 md:h-12 ${tint.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={tint.icon} size={22} strokeWidth={2.2} />
      </div>
      <div className="min-w-0" title={fullLabel}>
        <p className="font-fun font-bold text-2xl md:text-3xl text-gray-900 dark:text-white leading-none">
          {value}
        </p>
        <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 font-bold truncate mt-1.5">
          {label}
          {sub && <span className="text-gray-400 dark:text-gray-500 ml-1">{sub}</span>}
        </p>
      </div>
    </div>
  )
}
