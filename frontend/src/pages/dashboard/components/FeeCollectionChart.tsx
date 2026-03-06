import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Wallet } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useT } from '../../../hooks/useT'
import type { FeeCollectionTrendPoint } from '../../../types'

export function FeeCollectionChart({
  data,
  loading,
}: {
  data: FeeCollectionTrendPoint[]
  loading: boolean
}) {
  const isDark = useSettingsStore((s) => s.darkMode)
  const t = useT()

  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.month + '-01').toLocaleDateString('en', { month: 'short' }),
  }))

  const tickFill = isDark ? '#9ca3af' : '#6b7280'
  const gridStroke = isDark ? '#374151' : '#e5e7eb'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-kinder-orange rounded-xl flex items-center justify-center flex-shrink-0">
          <Wallet size={16} className="text-white" />
        </div>
        <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('feeCollectionTrend')}</h2>
      </div>

      {loading ? (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-shimmer bg-[length:200%_100%]" />
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{t('noTrendData')}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="label" tick={{ fill: tickFill, fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => 'RM ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
              width={55}
              tick={{ fill: tickFill, fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#fff',
                border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                borderRadius: 12,
              }}
              formatter={(value: number | undefined) => ['RM ' + (value ?? 0).toLocaleString()]}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="owed"
              fill="#FF6B35"
              radius={[4, 4, 0, 0]}
              name={t('totalOwed') || 'Owed'}
            />
            <Bar
              dataKey="collected"
              fill="#6BCB77"
              radius={[4, 4, 0, 0]}
              name={t('totalCollected') || 'Collected'}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
