'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

function getPasswordStrength(password: string) {
  if (password.length < 8) {
    return { level: 'weak' as const, label: 'Weak', percent: 33, color: 'bg-red-500' }
  }
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  if (hasNumber && hasSpecial) {
    return { level: 'strong' as const, label: 'Strong', percent: 100, color: 'bg-green-500' }
  }
  if (hasNumber) {
    return { level: 'medium' as const, label: 'Medium', percent: 66, color: 'bg-amber-500' }
  }
  return { level: 'weak' as const, label: 'Weak', percent: 33, color: 'bg-red-500' }
}

export default function SignupPage() {
  const router = useRouter()
  const emailRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errors: Record<string, string> = {}

    // Validate fields
    if (!email.trim()) errors.email = 'Email is required'
    else if (!validateEmail(email)) errors.email = 'Please enter a valid email address'

    if (!password.trim()) errors.password = 'Password is required'
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters'

    if (!confirmPassword.trim()) errors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        if (authError.message.toLowerCase().includes('already')) {
          setError('An account with this email already exists')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      router.push('/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = password ? getPasswordStrength(password) : null

  return (
    <Card className="w-full max-w-md shadow-sm">
      <CardHeader className="text-center space-y-2 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start using FnB.ai
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              ref={emailRef}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-sm text-destructive">{fieldErrors.password}</p>
            )}

            {/* Password strength indicator */}
            {password && passwordStrength && (
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.percent}%` }}
                  />
                </div>
                <p className={`text-xs ${
                  passwordStrength.level === 'weak' ? 'text-red-500' :
                  passwordStrength.level === 'medium' ? 'text-amber-500' :
                  'text-green-500'
                }`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="sm" className="text-primary-foreground" />
            ) : (
              'Create Account'
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
