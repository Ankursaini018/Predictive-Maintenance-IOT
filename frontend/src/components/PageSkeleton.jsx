export default function PageSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse select-none">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded-lg bg-white/10" />
          <div className="h-4 w-72 rounded-md bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-white/10" />
          <div className="h-9 w-32 rounded-xl bg-white/10" />
        </div>
      </div>

      {/* Skeleton KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-28 rounded-2xl p-4 glass flex flex-col justify-between"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-white/10" />
              <div className="w-8 h-8 rounded-xl bg-white/10" />
            </div>
            <div className="h-7 w-20 rounded bg-white/15" />
            <div className="h-3 w-36 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Skeleton Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="col-span-1 lg:col-span-7 h-80 rounded-2xl glass p-5 space-y-4">
          <div className="h-5 w-48 rounded bg-white/10" />
          <div className="h-56 rounded-xl bg-white/5" />
        </div>
        <div className="col-span-1 lg:col-span-5 h-80 rounded-2xl glass p-5 space-y-4">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="h-12 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
