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

export default function RegisterPageEN() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSocialLogin = (provider: "google") => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
    window.location.href = `${backendUrl}/auth/${provider}`
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      await apiClient.register(email, name, password)

      // Show success toast and redirect
      toast.success("Registration Successful!", {
        description: "Redirecting to login page...",
      })

      setTimeout(() => {
        router.push("/en/login")
      }, 1500)
    } catch (err: any) {
      toast.error("Registration Failed", {
        description: err.message || "Please try again.",
      })
      setError(err.message || "Failed to register.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/en">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/en" className="inline-flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="VibeScan Logo"
              width={64}
              height={64}
              className="w-16 h-16"
            />
            <h1 className="text-3xl font-semibold text-gray-900">
              VibeScan
            </h1>
          </Link>
          <p className="text-gray-500 mt-2">Security Analysis Service</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create a new account and start security scans for free
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
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#374151]">
                  Email
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
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby={error ? "register-error password-requirements" : "password-requirements"}
                />
                <p id="password-requirements" className="text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[#374151]">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  aria-required="true"
                  aria-invalid={error && error.includes("match") ? "true" : "false"}
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
                    <span>Signing Up...</span>
                    <span className="sr-only">Processing registration...</span>
                  </>
                ) : "Sign Up"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3 hover:bg-gray-50"
                  onClick={() => handleSocialLogin("google")}
                  aria-label="Sign up with Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </div>

              <div className="text-center text-sm text-[#6B7280] mt-6">
                Already have an account?{" "}
                <Link
                  href="/en/login"
                  className="text-[#0064FF] hover:underline font-medium"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 text-center text-sm text-[#6B7280]">
          <p className="mb-2">Included in Free Plan:</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span>✓ 1 Scan per Month</span>
            <span>✓ Basic Security Check</span>
            <span>✓ Public Ranking</span>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="text-center mt-6">
          <Link
            href="/register"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            onClick={() => {
              document.cookie = "user-lang-preference=ko; path=/; max-age=31536000"
            }}
          >
            🇰🇷 한국어
          </Link>
        </div>
      </div>
    </div>
  )
}
