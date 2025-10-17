"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Check, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"

const PLAN_INFO: Record<string, {
  name: string;
  price: number;
  scans: number;
  features: string[];
}> = {
  starter: {
    name: "Starter",
    price: 9900,
    scans: 5,
    features: [
      "월 5회 보안 스캔",
      "전체 취약점 리포트",
      "PDF 다운로드",
      "AI 기반 취약점 분석",
    ],
  },
  pro: {
    name: "Pro",
    price: 29900,
    scans: 10,
    features: [
      "월 10회 보안 스캔",
      "전체 취약점 리포트",
      "PDF 다운로드",
      "AI 기반 취약점 분석",
      "우선 지원",
      "스캔 히스토리 무제한",
    ],
  },
  business: {
    name: "Business",
    price: 99900,
    scans: 50,
    features: [
      "월 50회 보안 스캔",
      "전체 취약점 리포트",
      "PDF 다운로드",
      "AI 기반 취약점 분석",
      "실시간 취약점 모니터링",
      "팀 멤버 관리",
      "API 액세스",
      "전담 지원",
    ],
  },
}

function SubscriptionCheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") as "starter" | "pro" | "business" | null
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login?redirect=/pricing")
      return
    }

    // Validate plan
    if (!plan || !PLAN_INFO[plan]) {
      toast.error("잘못된 플랜입니다")
      router.push("/pricing")
      return
    }

    // Get user info
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Check for billing auth failure
    const error = searchParams.get("error")
    const errorCode = searchParams.get("code")
    const errorMessage = searchParams.get("message")

    if (error === "billing_auth_failed") {
      console.log("[BILLING_AUTH] Failed:", { errorCode, errorMessage })

      // Display error to user
      toast.error("카드 등록 실패", {
        description: errorMessage ? decodeURIComponent(errorMessage) : "카드 정보를 확인해주세요.",
      })

      // Clear error parameters from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      newUrl.searchParams.delete("code")
      newUrl.searchParams.delete("message")
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [plan, router, searchParams])

  const handleSubscribe = async () => {
    if (!plan) return

    setLoading(true)
    try {
      // Get customerKey from backend (구독 정보는 변경하지 않음!)
      const result = await apiClient.initiateSubscription(plan)
      console.log('[SUBSCRIPTION] Received result:', result)

      if (!result.customerKey) {
        console.error('[SUBSCRIPTION] No customerKey in result:', result)
        toast.error("구독 시작에 실패했습니다")
        setLoading(false)
        return
      }

      // Store plan in sessionStorage to pass it after billing auth
      sessionStorage.setItem('pendingSubscriptionPlan', plan)

      // Load TossPayments V2 SDK
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_XZYkKL4MrjjoNwWzKWERr0zJwlEW"
      const tossPayments = await loadTossPayments(clientKey)

      // Create payment instance with customerKey
      const payment = tossPayments.payment({
        customerKey: result.customerKey,
      })

      // Request billing authentication
      await payment.requestBillingAuth({
        method: "CARD", // 자동결제(빌링)는 카드만 지원
        successUrl: `${window.location.origin}/subscription/billing-auth`,
        failUrl: `${window.location.origin}/subscription/checkout?plan=${plan}&error=billing_auth_failed`,
        customerEmail: user?.email || "",
        customerName: user?.name || user?.email || "고객",
      })
    } catch (error: any) {
      console.error("[SUBSCRIPTION] Error:", error)
      toast.error("구독 처리 실패", {
        description: error.message || "잠시 후 다시 시도해주세요.",
      })
      setLoading(false)
    }
  }

  if (!plan || !PLAN_INFO[plan]) {
    return null
  }

  const planInfo = PLAN_INFO[plan]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                플랜 목록
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">구독 결제</h1>
          <p className="text-gray-600">
            선택하신 플랜으로 구독을 시작합니다
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {planInfo.name} 플랜
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₩{planInfo.price.toLocaleString()}
                  <span className="text-base font-normal text-gray-600">/월</span>
                </div>
                <div className="text-sm text-gray-600">월 {planInfo.scans}회 스캔</div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">포함된 기능</p>
                {planInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">결제 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">플랜</span>
                  <span className="font-medium text-gray-900">{planInfo.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">결제 주기</span>
                  <span className="font-medium text-gray-900">월간</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">첫 결제일</span>
                  <span className="font-medium text-gray-900">즉시</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-semibold text-gray-900">총 결제 금액</span>
                  <span className="font-bold text-gray-900">
                    ₩{planInfo.price.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-gray-50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-xs text-gray-600">
                  <p>• 매월 자동으로 결제됩니다</p>
                  <p>• 언제든지 구독을 취소할 수 있습니다</p>
                  <p>• 취소 시 다음 결제일까지 서비스 이용 가능</p>
                  <p>• 환불은 구독 정책에 따라 진행됩니다</p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>구독 시작하기</>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              구독 시작 버튼을 클릭하면{" "}
              <Link href="/terms" className="underline hover:text-gray-900">
                서비스 이용약관
              </Link>
              과{" "}
              <Link href="/privacy" className="underline hover:text-gray-900">
                개인정보 처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>로딩 중...</div></div>}>
      <SubscriptionCheckoutPageContent />
    </Suspense>
  )
}
