import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {icon && <div className="mb-4 text-neutral-400">{icon}</div>}
      <h3 className="text-lg font-medium text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 mb-4 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
