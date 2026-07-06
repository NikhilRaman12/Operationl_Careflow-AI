export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-lg border border-slate-200 bg-white p-4">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-5 h-8 w-32 rounded bg-slate-200" />
            <div className="mt-4 h-3 w-full rounded bg-slate-100" />
            <div className="mt-2 h-3 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-8 h-56 rounded bg-slate-100" />
        </div>
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white p-4">
          <div className="h-4 w-48 rounded bg-slate-200" />
          <div className="mt-8 h-56 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
