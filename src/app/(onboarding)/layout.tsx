import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UtensilsCrossed, LogOut } from 'lucide-react'
import { LogoutButton } from './logout-button'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const { data } = await supabase.auth.getUser()
  const user = data?.user
  if (!user) {
    redirect('/login')
  }

  // Check if business already exists — skip onboarding
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (business) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <span className="font-semibold text-lg">FnB.ai</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Centered content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
