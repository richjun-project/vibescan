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

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다")
      setLoading(false)
      return
    }

    try {
      await apiClient.register(email, name, password)

      // Show success toast and redirect
      toast.success("회원가입 완료!", {
        description: "로그인 페이지로 이동합니다.",
      })

      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (err: any) {
      toast.error("회원가입 실패", {
        description: err.message || "다시 시도해주세요.",
      })
      setError(err.message || "회원가입에 실패했습니다.")
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
            <CardTitle>회원가입</CardTitle>
            <CardDescription>
              새 계정을 만들고 무료로 보안 스캔을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
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
                <label htmlFor="name" className="text-sm font-medium text-[#374151]">
                  이름
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>

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
                  aria-describedby={error ? "register-error password-requirements" : "password-requirements"}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#374151]">
                  비밀번호
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="최소 6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "register-error password-requirements" : "password-requirements"}
                />
                <p id="password-requirements" className="text-xs text-gray-500">
                  비밀번호는 최소 6자 이상이어야 합니다
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
                  비밀번호 확인
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error && error.includes("일치") ? "true" : "false"}
                  aria-describedby={error ? "register-error" : undefined}
                />
              </div>
              {error && <span id="register-error" className="sr-only">{error}</span>}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span>가입 중...</span>
                    <span className="sr-only">회원가입을 처리하는 중입니다</span>
                  </>
                ) : "회원가입"}
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
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="text-[#0064FF] hover:underline font-medium"
                >
                  로그인
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center text-sm text-[#6B7280]">
          <p className="mb-2">무료 플랜 포함:</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span>✓ 월 1회 스캔</span>
            <span>✓ 기본 보안 체크</span>
            <span>✓ 공개 랭킹</span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              document.cookie = "user-lang-preference=en; path=/; max-age=31536000"
              window.location.href = "/en/register"
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
