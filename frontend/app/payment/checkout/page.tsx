"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

// TossPayments SDK v2 타입 정의
declare global {
  interface Window {
    TossPayments: any
  }
}

function CheckoutPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const widgetsRef = useRef<any>(null)

  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const scanCount = parseInt(searchParams.get("scanCount") || "1")

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          router.push("/login?redirect=/pricing")
          return
        }

        // Create payment order using apiClient (with auto token refresh)
        const data = await apiClient.createPaymentOrder(scanCount) as any
        setOrderData(data)

        // Load TossPayments SDK v2
        if (!window.TossPayments) {
          const script = document.createElement('script')
          script.src = 'https://js.tosspayments.com/v2/standard'
          script.async = true
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        // Initialize TossPayments SDK v2
        const tossPayments = window.TossPayments(data.clientKey)

        // Create widgets instance
        const widgets = tossPayments.widgets({
          customerKey: data.customerEmail, // customerKey로 고객 식별
        })

        // Set payment amount
        await widgets.setAmount({
          currency: 'KRW',
          value: data.amount,
        })

        // Render payment methods
        await widgets.renderPaymentMethods({
          selector: '#payment-widget',
          variantKey: 'DEFAULT',
        })

        widgetsRef.current = widgets

        setLoading(false)
      } catch (err) {
        console.error("Payment initialization error:", err)
        setError("결제 초기화 중 오류가 발생했습니다.")
        setLoading(false)
      }
    }

    initializePayment()
  }, [scanCount, router])

  const handlePayment = async () => {
    try {
      if (!widgetsRef.current || !orderData) {
        throw new Error("Payment widget not initialized")
      }

      // TossPayments SDK v2: widgets.requestPayment()
      await widgetsRef.current.requestPayment({
        orderId: orderData.orderId,
        orderName: orderData.orderName,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        successUrl: `${window.location.origin}/payment/success?scanCount=${scanCount}`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (err) {
      console.error("Payment request error:", err)
      alert("결제 요청 중 오류가 발생했습니다.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제 준비 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-full"
          >
            요금제 페이지로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">결제하기</h1>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">주문 정보</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">상품</span>
                <span className="font-semibold text-gray-900">{orderData?.orderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">수량</span>
                <span className="font-semibold text-gray-900">{scanCount}회</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-300">
                <span className="text-lg font-semibold text-gray-900">총 결제 금액</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₩{orderData?.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Widget */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
            <div id="payment-widget" className="p-6"></div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-full text-lg font-bold shadow-sm transition-all duration-200"
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}
