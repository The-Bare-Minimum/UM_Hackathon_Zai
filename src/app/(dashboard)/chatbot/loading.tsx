import { Skeleton } from '@/components/ui/skeleton'

export default function ChatbotLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-5 w-[150px] mb-1" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden p-4 space-y-6">
        {/* Left message */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-20 w-[300px] rounded-2xl rounded-tl-sm" />
          </div>
        </div>

        {/* Right message */}
        <div className="flex gap-3 justify-end">
          <div className="space-y-2 flex flex-col items-end">
            <Skeleton className="h-12 w-[250px] rounded-2xl rounded-tr-sm" />
          </div>
        </div>

        {/* Left message */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-24 w-[350px] rounded-2xl rounded-tl-sm" />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-md" />
          <Skeleton className="h-12 w-12 rounded-md" />
        </div>
      </div>
    </div>
  )
}
