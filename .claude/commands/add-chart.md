TRIGGER when: user asks to add a chart, graph, or data visualization to a page, or mentions recharts, trend chart, bar chart, line chart, pie chart.

# add-chart — Add a Chart to a Page

Chart description: $ARGUMENTS

Work through every step in order.

## Step 0 — Understand the Request

Parse the user's description to determine:

1. **Chart type**: line, bar, area, pie, or composed (recharts component)
2. **Data source**: which DB table(s), what aggregation (sum, count, avg, group-by)
3. **Target page**: which page the chart lives on (usually DashboardPage, but could be any)
4. **Time range**: how many months/weeks of data (default: last 6 months)

## Step 1 — Shared Types

Add the chart's data point interface to `packages/types/index.ts`:

```ts
// Name it descriptively: <What><Granularity>Point
export interface AttendanceTrendPoint {
  month: string // "YYYY-MM"
  total: number
  present: number
  rate: number // 0-100
}
```

Rules:

- `month` field is always `string` in `"YYYY-MM"` format
- Numeric fields use `number` (not string)
- Keep it flat — no nested objects

## Step 2 — Backend Endpoint

Add a `GET` route to the **existing** route file for that resource. Do NOT create a new route file.

**Placement**: BEFORE any `/:id` dynamic routes, grouped with other static paths.

**Pattern**:

```ts
resource.get('/trend', async (c) => {
  const query = z.object({
    months: z.coerce.number().int().min(1).max(12).default(6),
  })
  const { months } = query.parse(c.req.query())

  // Compute date range
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const startDate = start.toISOString().slice(0, 10)
  const endDate = now.toISOString().slice(0, 10)

  // Query — select only needed columns, no pagination
  const { data, error } = await supabase
    .from('table')
    .select('date_column, value_column')
    .gte('date_column', startDate)
    .lte('date_column', endDate)

  if (error) return c.json({ error: 'Failed to fetch trend data' }, 500)

  // Group by month, aggregate, sort ascending
  const grouped = new Map<
    string,
    {
      /* accumulators */
    }
  >()
  for (const row of data ?? []) {
    const month = row.date_column.substring(0, 7)
    // accumulate...
  }

  const result = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, agg]) => ({ month /* computed fields */ }))

  return c.json(result)
})
```

Key rules:

- Chart endpoints return a **flat array** directly — NOT the paginated `{ data, meta }` wrapper
- Use Zod for query validation with sensible defaults
- Group in JS (not SQL) — Supabase JS client doesn't support GROUP BY
- Only `select()` the columns you need — charts don't need full rows
- `date_column` is the canonical date field for that resource (`date` for attendance, `due_date` for fees)
- No `sanitiseStrings` needed — these are read-only GET endpoints
- No new registration in `index.ts` needed if the resource route file is already mounted

## Step 3 — API Function

Add to the relevant `*Api` object in `frontend/src/lib/api.ts`:

```ts
getTrend: (months?: number) =>
  api.get('/resource/trend', { params: { months } }).then((r) => r.data),
```

## Step 4 — Translation Keys

Add to BOTH `en` and `ms` blocks in `frontend/src/lib/translations.ts`:

Required keys per chart:

- `<chartName>`: chart card title (e.g. `'Attendance Trend'` / `'Trend Kehadiran'`)
- `noTrendData`: shared empty state message (already exists — reuse it)

Optional (if tooltip needs a custom label):

- `<chartName>Tooltip`: tooltip value label

## Step 5 — Chart Component

Create `frontend/src/pages/<page>/components/<ChartName>Chart.tsx`.

**One component per file. One chart per component.**

### Imports

```tsx
import { ResponsiveContainer, <ChartType>, <Elements> } from 'recharts'
import { <Icon> } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useT } from '../../../hooks/useT'
import type { <DataPoint> } from '../../../types'
```

### Props

```tsx
{ data: DataPoint[]; loading: boolean }
```

### Card wrapper (mandatory)

```tsx
<div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
```

### Header (mandatory)

Icon box + title — match the existing card heading style on the target page:

```tsx
<div className="flex items-center gap-2 mb-5">
  <div className="w-8 h-8 bg-kinder-<color> rounded-xl flex items-center justify-center flex-shrink-0">
    <Icon size={16} className="text-white" />
  </div>
  <h2 className="font-bold text-gray-900 dark:text-gray-100">{t('chartTitle')}</h2>
</div>
```

### Three states (mandatory)

1. **Loading**: `<div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-shimmer bg-[length:200%_100%]" />`
2. **Empty** (data.length === 0 && !loading): centered muted text `t('noTrendData')`
3. **Chart**: the actual recharts content

### Dark mode theming (mandatory)

Read dark mode state and derive colors:

```tsx
const isDark = useSettingsStore((s) => s.darkMode)
const tickFill = isDark ? '#9ca3af' : '#6b7280'
const gridStroke = isDark ? '#374151' : '#e5e7eb'
```

Apply to all recharts elements:

- `CartesianGrid stroke={gridStroke}`
- `XAxis tick={{ fill: tickFill, fontSize: 12 }}`
- `YAxis tick={{ fill: tickFill, fontSize: 12 }}`
- `Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'), borderRadius: 12 }}`

### Month label transformation (for time-series charts)

```tsx
const chartData = data.map((d) => ({
  ...d,
  label: new Date(d.month + '-01').toLocaleDateString('en', { month: 'short' }),
}))
```

Do NOT add date-fns — use native `Date.toLocaleDateString`.

### ResponsiveContainer (mandatory)

```tsx
<ResponsiveContainer width="100%" height={200}>
```

### Chart-type-specific patterns

**Line chart** (trends, rates, percentages):

```tsx
<LineChart data={chartData}>
  <Line
    type="monotone"
    dataKey="rate"
    stroke="#6BCB77"
    strokeWidth={2.5}
    dot={{ r: 4, fill: '#6BCB77' }}
    activeDot={{ r: 6 }}
  />
</LineChart>
```

**Bar chart** (comparisons, amounts):

```tsx
<BarChart data={chartData} barGap={4}>
  <Bar dataKey="owed" fill="#FF6B35" radius={[4, 4, 0, 0]} name={t('labelKey')} />
  <Bar dataKey="collected" fill="#6BCB77" radius={[4, 4, 0, 0]} name={t('labelKey')} />
  <Legend wrapperStyle={{ fontSize: 12 }} />
</BarChart>
```

**Pie chart** (breakdowns, distributions):

```tsx
<PieChart>
  <Pie
    data={chartData}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    innerRadius={40}
    outerRadius={80}
    paddingAngle={2}
  >
    {chartData.map((_, i) => (
      <Cell key={i} fill={COLORS[i % COLORS.length]} />
    ))}
  </Pie>
  <Legend wrapperStyle={{ fontSize: 12 }} />
</PieChart>
```

### Color palette

Use kinder-\* colors for chart elements:

- `#FF6B35` (kinder-orange) — primary, fees/money
- `#4D96FF` (kinder-blue) — secondary, info
- `#6BCB77` (kinder-green) — positive, attendance, collected
- `#FFD93D` (kinder-yellow) — warnings, highlights
- `#C77DFF` (kinder-purple) — tertiary
- `#FF85A2` (kinder-pink) — accent

### YAxis formatting by data type

- Percentages: `tickFormatter={(v) => v + '%'}`, `domain={[0, 100]}`, `width={40}`
- Currency (RM): `tickFormatter={(v) => 'RM ' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}`, `width={55}`
- Counts: `tickFormatter={(v) => v.toLocaleString()}`, `width={40}`

## Step 6 — Page Integration

In the target page component:

1. **Import** the chart component
2. **Add a `useQuery` hook**:

```tsx
const { data: trendData, isLoading: trendLoading } = useQuery({
  queryKey: ['resource-trend'],
  queryFn: () => resourceApi.getTrend(6),
  staleTime: 5 * 60_000, // 5 minutes — trend data is not real-time
})
```

3. **Place in layout** — charts go in a responsive grid:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <ChartA data={dataA ?? []} loading={loadingA} />
  <ChartB data={dataB ?? []} loading={loadingB} />
</div>
```

Single chart: use `grid-cols-1` only (full width).
Two charts: `grid-cols-1 lg:grid-cols-2`.
Three charts: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`.

## Step 7 — Backend Tests

Add to the existing test file for that route (`backend/src/routes/<resource>.test.ts`):

```ts
describe('GET /trend — <chart name>', () => {
  test('returns trend data with correct aggregation', async () => {
    setMockResponse('table', {
      data: [
        /* mock rows */
      ],
      error: null,
    })
    const res = await resource.request('/trend?months=3')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    // Assert grouping, aggregation, sorting
  })

  test('returns empty array when no data', async () => {
    setMockResponse('table', { data: [], error: null })
    const res = await resource.request('/trend')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  test('returns 500 on database error', async () => {
    setMockResponse('table', { data: null, error: { message: 'db fail' } })
    const res = await resource.request('/trend')
    expect(res.status).toBe(500)
  })
})
```

## Step 8 — Verify

Run `bun run test` and `bun run lint` from the project root. All tests must pass with 0 errors.

## Existing Charts (Reference)

| Chart            | Type | Endpoint                      | Component                                       |
| ---------------- | ---- | ----------------------------- | ----------------------------------------------- |
| Attendance Trend | Line | `GET /attendance/stats/trend` | `dashboard/components/AttendanceTrendChart.tsx` |
| Fee Collection   | Bar  | `GET /fees/trend`             | `dashboard/components/FeeCollectionChart.tsx`   |

When adding charts to DashboardPage, slot them into the existing chart grid (the `grid-cols-1 lg:grid-cols-2` div) rather than creating a new section.
