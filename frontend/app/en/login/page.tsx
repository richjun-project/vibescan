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

export default function LoginPageEN() {
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

      toast.success("Login Successful!", {
        description: "Redirecting to dashboard...",
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/en/dashboard")
      }, 1000)
    } catch (err: any) {
      toast.error("Login Failed", {
        description: err.message || "Please check your email and password.",
      })
      setError(err.message || "Failed to log in.")
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
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Log in to your account to start security scans
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
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#374151]">
                  Password
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
                    <span>Signing In...</span>
                    <span className="sr-only">Processing login...</span>
                  </>
                ) : "Sign In"}
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
                <GoogleOAuthButton lang="en" />
              </div>

              <div className="text-center text-sm text-[#6B7280] mt-6">
                Don&apos;t have an account?{" "}
                <Link
                  href="/en/register"
                  className="text-[#0064FF] hover:underline font-medium"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Language Switcher */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              document.cookie = "user-lang-preference=ko; path=/; max-age=31536000"
              window.location.href = "/login"
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            🇰🇷 한국어
          </button>
        </div>
      </div>
    </div>
  )
}
