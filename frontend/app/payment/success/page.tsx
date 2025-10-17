"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"

function PaymentSuccessPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get("paymentKey")
      const orderId = searchParams.get("orderId")
      const amount = searchParams.get("amount")

      if (!paymentKey || !orderId || !amount) {
        setError("결제 정보가 올바르지 않습니다.")
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          router.push("/login")
          return
        }

        // Confirm payment with backend
        const response = await fetch(`${BACKEND_URL}/payment/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        })

        if (!response.ok) {
          throw new Error("결제 승인에 실패했습니다.")
        }

        const data = await response.json()
        setPaymentInfo(data)
        setSuccess(true)
        setLoading(false)

        // Check if we need to upgrade a scan
        const upgradeScanId = localStorage.getItem("upgradeScanId")
        if (upgradeScanId) {
          try {
            await apiClient.upgradeScanToPaid(parseInt(upgradeScanId))
            toast.success("AI 분석이 생성되고 있습니다!", {
              description: "몇 초 후 상세 리포트를 확인할 수 있습니다",
            })
            localStorage.removeItem("upgradeScanId")

            // Redirect to scan detail page instead of dashboard
            setTimeout(() => {
              router.push(`/scans/${upgradeScanId}`)
            }, 3000)
            return
          } catch (err) {
            console.error("Scan upgrade error:", err)
            toast.error("스캔 업그레이드 실패", {
              description: "대시보드에서 다시 시도해주세요",
            })
            localStorage.removeItem("upgradeScanId")
          }
        }

        // Start countdown to dashboard (if not upgrading scan)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              router.push("/dashboard")
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(timer)
      } catch (err) {
        console.error("Payment confirmation error:", err)
        setError(err instanceof Error ? err.message : "결제 승인 중 오류가 발생했습니다.")
        setLoading(false)
      }
    }

    confirmPayment()
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">결제 승인 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-8 shadow-2xl text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">결제 실패</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link href="/pricing">
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12">
                요금제 페이지로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-2xl text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-green-500/25">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              결제가 완료되었습니다!
            </h1>
            <p className="text-gray-600 mb-8">
              {paymentInfo?.scanCount}회의 상세 리포트가 추가되었습니다.
              <br />
              남은 리포트: {paymentInfo?.paidScansRemaining}회
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>결제 금액</span>
                  <span className="font-semibold">₩{paymentInfo?.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>구매 수량</span>
                  <span className="font-semibold">{paymentInfo?.scanCount}회</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                {countdown}초 후 대시보드로 자동 이동됩니다...
              </p>
            </div>

            <Link href="/dashboard">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12 text-base font-semibold group shadow-lg shadow-blue-500/25">
                대시보드로 이동
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>로딩 중...</div></div>}>
      <PaymentSuccessPageContent />
    </Suspense>
  )
}
