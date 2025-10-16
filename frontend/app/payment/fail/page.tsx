"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function PaymentFailPageContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "결제가 취소되었습니다."
  const code = searchParams.get("code")

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-8 shadow-2xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-red-500/25">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">결제 실패</h1>
          <p className="text-gray-600 mb-2">{message}</p>
          {code && <p className="text-sm text-gray-500 mb-8">오류 코드: {code}</p>}

          <div className="space-y-3">
            <Link href="/pricing">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12 text-base font-semibold group shadow-lg shadow-blue-500/25">
                다시 시도하기
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full h-12 text-base font-semibold">
                대시보드로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>로딩 중...</div></div>}>
      <PaymentFailPageContent />
    </Suspense>
  )
}
