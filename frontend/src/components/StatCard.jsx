import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * @param {string} label - Card label
 * @param {string|number} value - Main value
 * @param {string} [unit] - Unit suffix
 * @param {string} [trend] - 'up' | 'down' | 'flat'
 * @param {string} [trendLabel] - e.g. "+2.3%"
 * @param {React.ReactNode} [icon] - Icon component
 * @param {string} [accentColor] - Hex color for accent
 * @param {string} [description] - Sub-description text
 */
export default function StatCard({
  label,
  value,
  unit = '',
  trend,
  trendLabel,
  icon,
  accentColor = '#00d4ff',
  description,
}) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up' ? '#00ff88' : trend === 'down' ? '#ff4444' : '#8892a4'

  return (
    <div
      className="glass glass-hover p-5 flex flex-col gap-3"
      style={{ borderLeft: `2px solid ${accentColor}40` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>
          {label}
        </p>
        {icon && (
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold mono leading-none text-white">{value}</span>
        {unit && <span className="text-sm mb-0.5" style={{ color: '#8892a4' }}>{unit}</span>}
      </div>

      {/* Trend + description */}
      <div className="flex items-center justify-between">
        {description && (
          <p className="text-[11px]" style={{ color: '#8892a4' }}>{description}</p>
        )}
        {trend && trendLabel && (
          <div className="flex items-center gap-1 ml-auto">
            <TrendIcon size={12} color={trendColor} />
            <span className="text-xs font-medium" style={{ color: trendColor }}>
              {trendLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
