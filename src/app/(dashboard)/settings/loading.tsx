import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav Skeleton */}
        <div className="w-48 space-y-2 hidden md:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>

        {/* Form Skeleton */}
        <div className="flex-1 space-y-8">
          {Array.from({ length: 4 }).map((_, sectionIdx) => (
            <div key={sectionIdx} className="space-y-4">
              <Skeleton className="h-6 w-[150px]" />
              <div className="rounded-xl border bg-card p-6 space-y-6">
                {Array.from({ length: 3 }).map((_, fieldIdx) => (
                  <div key={fieldIdx} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full max-w-md" />
                    <Skeleton className="h-3 w-[250px]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
