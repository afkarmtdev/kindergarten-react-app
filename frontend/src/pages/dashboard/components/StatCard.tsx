import { Users } from 'lucide-react'

const TINT: Record<string, { bg: string; icon: string }> = {
  'bg-kinder-blue': {
    bg: 'bg-kinder-blue/10 dark:bg-kinder-blue/15',
    icon: 'text-kinder-blue',
  },
  'bg-kinder-purple': {
    bg: 'bg-kinder-purple/10 dark:bg-kinder-purple/15',
    icon: 'text-kinder-purple',
  },
  'bg-kinder-green': {
    bg: 'bg-kinder-green/10 dark:bg-kinder-green/15',
    icon: 'text-kinder-green',
  },
  'bg-kinder-orange': {
    bg: 'bg-kinder-orange/10 dark:bg-kinder-orange/15',
    icon: 'text-kinder-orange',
  },
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
    <div className="flex items-center gap-3 md:gap-4 bg-white dark:bg-gray-900 rounded-2xl p-4 md:p-5 border border-gray-200 dark:border-gray-800">
      <div
        className={`w-9 h-9 md:w-10 md:h-10 ${tint.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
      >
        <Icon className={tint.icon} size={18} />
      </div>
      <div className="min-w-0" title={fullLabel}>
        <p className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
          {value}
        </p>
        <p className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
          {label}
          {sub && <span className="text-gray-400 dark:text-gray-500 ml-1">{sub}</span>}
        </p>
      </div>
    </div>
  )
}
