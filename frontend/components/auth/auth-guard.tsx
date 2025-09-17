"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsAuthenticated(false)
        router.push("/login")
        return
      }
      try {
        // Decode JWT payload
        const payload = JSON.parse(atob(token.split(".")[1]))
        // If token has exp, check expiration
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("token")
          setIsAuthenticated(false)
          router.push("/login")
          return
        }
        // Optionally, validate token with backend
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("token")
          setIsAuthenticated(false)
          router.push("/login")
        }
      } catch (error) {
        localStorage.removeItem("token")
        setIsAuthenticated(false)
        router.push("/login")
      }
    }
    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
