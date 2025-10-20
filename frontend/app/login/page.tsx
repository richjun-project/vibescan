"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Shield, ArrowLeft } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { GoogleOAuthButton } from "@/components/oauth-button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = await apiClient.login(email, password)

      // Save tokens and user data
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("user", JSON.stringify(data.user))

      toast.success("로그인 성공!", {
        description: "대시보드로 이동합니다.",
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (err: any) {
      toast.error("로그인 실패", {
        description: err.message || "이메일과 비밀번호를 확인해주세요.",
      })
      setError(err.message || "로그인에 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="VibeScan 로고"
              width={64}
              height={64}
              className="w-16 h-16"
            />
            <h1 className="text-3xl font-semibold text-gray-900">
              VibeScan
            </h1>
          </Link>
          <p className="text-gray-500 mt-2">보안 점검 서비스</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>
              계정에 로그인하여 보안 스캔을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="bg-[#FEE2E2] border border-[#EF4444] text-[#DC2626] px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#374151]">
                  이메일
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#374151]">
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
              {error && <span id="login-error" className="sr-only">{error}</span>}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span>로그인 중...</span>
                    <span className="sr-only">로그인을 처리하는 중입니다</span>
                  </>
                ) : "로그인"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">또는</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <GoogleOAuthButton lang="ko" />
              </div>

              <div className="text-center text-sm text-[#6B7280] mt-6">
                계정이 없으신가요?{" "}
                <Link
                  href="/register"
                  className="text-[#0064FF] hover:underline font-medium"
                >
                  회원가입
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Language Switcher */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              document.cookie = "user-lang-preference=en; path=/; max-age=31536000"
              window.location.href = "/en/login"
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            🇺🇸 English
          </button>
        </div>
      </div>
    </div>
  )
}
