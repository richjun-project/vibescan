"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function BillingAuthPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("빌링키 인증 처리 중...")

  useEffect(() => {
    const authKey = searchParams.get("authKey")
    const customerKey = searchParams.get("customerKey")

    if (!authKey || !customerKey) {
      setStatus("error")
      setMessage("잘못된 접근입니다")
      return
    }

    // Complete billing authentication
    completeBillingAuth(authKey, customerKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const completeBillingAuth = async (authKey: string, customerKey: string) => {
    try {
      const result = await apiClient.completeBillingAuth(authKey, customerKey)

      setStatus("success")
      setMessage("구독이 성공적으로 시작되었습니다!")

      // Update user data in localStorage
      const userData = await apiClient.getProfile()
      localStorage.setItem("user", JSON.stringify(userData))

      toast.success("구독 시작 완료", {
        description: "이제 프리미엄 기능을 사용하실 수 있습니다.",
      })

      // Redirect to success page
      setTimeout(() => {
        router.push("/subscription/success")
      }, 2000)
    } catch (error: any) {
      console.error("Billing auth error:", error)
      setStatus("error")
      setMessage(error.message || "구독 처리에 실패했습니다")

      toast.error("구독 시작 실패", {
        description: error.message || "잠시 후 다시 시도해주세요.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="VibeScan 로고"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-gray-900">
                VibeScan
              </h1>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="border border-gray-200">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              {status === "processing" && (
                <>
                  <div className="flex justify-center">
                    <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
                  <p className="text-sm text-gray-600">잠시만 기다려주세요...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
                  <p className="text-sm text-gray-600">잠시 후 결제 완료 페이지로 이동합니다...</p>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <XCircle className="w-7 h-7 text-gray-900" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">구독 처리 실패</h2>
                  <p className="text-sm text-gray-600">{message}</p>
                  <div className="flex gap-3 justify-center pt-4">
                    <Link href="/pricing">
                      <Button variant="outline" size="sm">
                        플랜 목록으로
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                        대시보드로
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function BillingAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>로딩 중...</div></div>}>
      <BillingAuthPageContent />
    </Suspense>
  )
}
