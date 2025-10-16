"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Shield } from "lucide-react"

function AuthCallbackPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const accessToken = searchParams.get("accessToken")
    const refreshToken = searchParams.get("refreshToken")

    if (accessToken && refreshToken) {
      // Store tokens in localStorage
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)

      // Fetch user data
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      fetch(`${apiUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("user", JSON.stringify(data))
          // Redirect to dashboard
          router.push("/dashboard")
        })
        .catch((error) => {
          console.error("Failed to fetch user data:", error)
          router.push("/login")
        })
    } else {
      // No tokens, redirect to login
      router.push("/login")
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-[#0064FF] animate-pulse" />
        <p className="text-[#6B7280] text-lg">로그인 처리 중...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>로딩 중...</div></div>}>
      <AuthCallbackPageContent />
    </Suspense>
  )
}
