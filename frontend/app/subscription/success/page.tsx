"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchSubscription()
  }, [router])

  const fetchSubscription = async () => {
    try {
      const data = await apiClient.getSubscription()
      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      free: "Free",
      pro: "Pro",
      business: "Business",
      enterprise: "Enterprise",
    }
    return names[plan?.toLowerCase()] || plan
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    )
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

      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            구독이 시작되었습니다
          </h1>
          <p className="text-gray-600">
            이제 {getPlanName(subscription?.plan)} 플랜의 모든 기능을 사용하실 수 있습니다
          </p>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <Card className="mb-8 border border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">플랜</span>
                  <span className="font-semibold text-gray-900">
                    {getPlanName(subscription.plan)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">결제 금액</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.amount > 0
                      ? `₩${subscription.amount.toLocaleString()}/월`
                      : "무료"
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">월간 스캔 횟수</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.monthlyScansLimit}회
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">다음 결제일</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.nextBillingDate
                      ? new Date(subscription.nextBillingDate).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Button */}
        <div className="flex justify-center">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium">
              대시보드로 이동
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            문의사항이 있으신가요?{" "}
            <a
              href="mailto:ggprgrkjh2@gmail.com"
              className="text-gray-900 hover:underline font-medium"
            >
              ggprgrkjh2@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
