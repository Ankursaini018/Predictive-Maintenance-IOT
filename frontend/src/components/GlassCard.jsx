export default function GlassCard({ children, className = '', style = {}, hover = true }) {
  return (
    <div
      className={`glass ${hover ? 'glass-hover' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
