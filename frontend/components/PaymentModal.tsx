"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreditCard, Loader2, CheckCircle2, Sparkles, Shield, FileText } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scanId?: number
  vulnerabilityCount: number
  onSuccess?: () => void
}

export function PaymentModal({ open, onOpenChange, scanId, vulnerabilityCount, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      // Check authentication
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      if (!token) {
        toast.error("로그인이 필요합니다", {
          description: "결제를 진행하려면 먼저 로그인해주세요",
        })
        setLoading(false)
        onOpenChange(false)
        window.location.href = "/login?redirect=/pricing"
        return
      }

      // Store scanId in localStorage for upgrade after payment success
      if (scanId) {
        localStorage.setItem("upgradeScanId", scanId.toString())
      }

      // Redirect to checkout page with scanCount
      window.location.href = `/payment/checkout?scanCount=1`
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error("결제 요청 실패", {
        description: error.message || "결제를 시작할 수 없습니다",
      })
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="payment-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            상세 리포트 업그레이드
          </DialogTitle>
          <DialogDescription id="payment-description">
            {vulnerabilityCount}개 취약점의 상세 정보와 AI 분석을 확인하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Value Proposition */}
          <div className="space-y-3" role="list" aria-label="제공 혜택">
            <h3 className="font-semibold text-gray-900 mb-3">업그레이드 시 제공 내용</h3>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg" role="listitem">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">전체 취약점 상세 분석</h4>
                <p className="text-sm text-gray-600">
                  {vulnerabilityCount}개 취약점의 설명, 영향도, CVE 정보 전체 공개
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg" role="listitem">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Gemini AI 분석</h4>
                <p className="text-sm text-gray-600">
                  AI 기반 우선순위 분석 및 비즈니스 영향도 평가
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg" role="listitem">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">즉시 적용 가능한 수정 가이드</h4>
                <p className="text-sm text-gray-600">
                  복사-붙여넣기 가능한 코드 예제와 단계별 해결 방법
                </p>
              </div>
            </div>
          </div>

          {/* Price Card */}
          <Card className="bg-blue-50 border-2 border-blue-200 p-6" role="region" aria-label="가격 정보">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">단 한 번의 결제로</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900" aria-label="현재 가격 9,900원">₩9,900</span>
                  <span className="text-sm text-gray-500 line-through" aria-label="정상 가격 29,000원">₩29,000</span>
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">⚡ 66% 할인 중</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-blue-600" aria-hidden="true" />
            </div>
          </Card>

          {/* CTA Button */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg font-bold py-6"
            aria-busy={loading}
            aria-label="9,900원 결제하고 전체 리포트 보기"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                <span>결제 준비 중...</span>
                <span className="sr-only">결제 시스템을 준비하는 중입니다</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" aria-hidden="true" />
                ₩9,900 결제하고 전체 보기
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-500" role="note">
            결제 후 즉시 상세 리포트가 공개됩니다 • 안전한 Toss Payments 결제
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
