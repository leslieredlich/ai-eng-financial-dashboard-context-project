import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { type MonthlyDataPoint } from '@/lib/financial-types'
import { formatCurrency } from '@/lib/financial-utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface IncomeOutcomeChartProps {
  data: MonthlyDataPoint[]
  loading?: boolean
}

interface TooltipPayload {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-medium text-foreground ml-auto pl-4">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

const IncomeOutcomeSkeleton = (
  <Card className="border-border/60">
    <CardHeader className="pb-4">
      <Skeleton className="h-5 w-52" />
      <Skeleton className="h-3 w-64 mt-1" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[280px] w-full rounded-lg" />
    </CardContent>
  </Card>
)

const IncomeOutcomeNoData = (
  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-sm" role="status">
    No data available to display
  </div>
)

export function IncomeOutcomeChart({ data, loading }: IncomeOutcomeChartProps) {
  if (loading) {
    return IncomeOutcomeSkeleton
  }

  const hasData = data.some((d) => d.income > 0 || d.outcome > 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold" id="income-outcome-title">Income vs. Outcome</CardTitle>
        <CardDescription>Monthly revenue and expenditure evolution</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? IncomeOutcomeNoData : (
          <div role="img" aria-label={`Income vs. Outcome chart — ${data.length} months from ${data[0]?.month ?? ''} to ${data[data.length - 1]?.month ?? ''}. Income ranges from $${Math.min(...data.map(d => d.income)) / 1000}k to $${Math.max(...data.map(d => d.income)) / 1000}k. Outcome ranges from $${Math.min(...data.map(d => d.outcome)) / 1000}k to $${Math.max(...data.map(d => d.outcome)) / 1000}k.`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={data}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                aria-labelledby="income-outcome-title"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.6} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground capitalize">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="var(--chart-income)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--chart-income)', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="outcome"
                  name="outcome"
                  stroke="var(--chart-outcome)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--chart-outcome)', strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
