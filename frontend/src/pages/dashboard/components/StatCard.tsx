import { Users } from 'lucide-react'

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
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div
          className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shadow-sm`}
        >
          <Icon className="text-white" size={22} />
        </div>
      </div>
    </div>
  )
}
