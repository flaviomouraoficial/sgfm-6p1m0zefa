import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface RadarChartCompProps {
  data: Array<{
    subject: string
    value: number
    fullMark: number
  }>
  color?: string
}

export function RadarChartComp({ data, color = '#2563eb' }: RadarChartCompProps) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8' }} />
          <Radar name="Média" dataKey="value" stroke={color} fill={color} fillOpacity={0.5} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            formatter={(value: number) => [value.toFixed(2), 'Nota']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
