import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useT } from '../../../hooks/useT'
import type { AttendanceTrendPoint } from '../../../types'

export function AttendanceTrendChart({
  data,
  loading,
}: {
  data: AttendanceTrendPoint[]
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
        <div className="w-8 h-8 bg-kinder-green rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingUp size={16} className="text-white" />
        </div>
        <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('attendanceTrend')}</h2>
      </div>

      {loading ? (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-shimmer bg-[length:200%_100%]" />
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">{t('noTrendData')}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="label" tick={{ fill: tickFill, fontSize: 12 }} />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => v + '%'}
              width={40}
              tick={{ fill: tickFill, fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#fff',
                border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                borderRadius: 12,
              }}
              formatter={(value: number | undefined) => [(value ?? 0) + '%', t('attendanceRate')]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#6BCB77"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6BCB77' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
