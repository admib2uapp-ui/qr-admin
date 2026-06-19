"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { AuthProvider } from "@/hooks/useAuth"
import { AdminGuard } from "@/components/layout/AdminGuard"
import { useState, useEffect } from "react"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as "light" | "dark" | null
    if (stored) {
      setTheme(stored)
      document.documentElement.classList.toggle("dark", stored === "dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
      document.documentElement.classList.toggle("dark", prefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("admin-theme", next)
    document.documentElement.classList.toggle("dark", next === "dark")
  }

  return (
    <AuthProvider>
      <AdminGuard>
        <SidebarProvider>
          <AppSidebar theme={theme} toggleTheme={toggleTheme} />
          <SidebarInset className="p-[3vw] sm:p-4 lg:p-6 bg-background min-h-screen">
            {children}
          </SidebarInset>
        </SidebarProvider>
      </AdminGuard>
    </AuthProvider>
  )
}
