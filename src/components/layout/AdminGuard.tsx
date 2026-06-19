"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, adminUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">Access Denied</h2>
          <p className="text-muted-foreground">You do not have admin privileges. Please contact the system administrator.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
