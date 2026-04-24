import { UtensilsCrossed } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FnB.ai</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered intelligence for F&amp;B businesses
        </p>
      </div>
      {children}
    </div>
  )
}
