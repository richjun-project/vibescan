"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Check, ArrowRight, Sparkles, Shield, Zap, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "월",
    scans: 1,
    description: "개인 프로젝트를 위한 무료 플랜",
    features: [
      "월 1회 보안 스캔",
      "기본 보안 점수",
      "미리보기 제공",
    ],
    icon: Shield,
    color: "from-gray-500 to-gray-600",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 9900,
    period: "월",
    scans: 5,
    description: "소규모 프로젝트를 위한 시작 플랜",
    features: [
      "월 5회 보안 스캔",
      "전체 취약점 리포트",
      "PDF 다운로드",
      "AI 기반 취약점 분석",
    ],
    icon: Sparkles,
    color: "from-green-500 to-green-600",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29900,
    period: "월",
    scans: 10,
    description: "개발자와 소규모 팀을 위한 플랜",
    features: [
      "월 10회 보안 스캔",
      "전체 취약점 리포트",
      "PDF 다운로드",
      "AI 기반 취약점 분석",
      "우선 지원",
      "스캔 히스토리 무제한",
    ],
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 99900,
    period: "월",
    scans: 50,
    description: "기업과 대규모 프로젝트를 위한 플랜",
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
    icon: Building2,
    color: "from-purple-500 to-purple-600",
    popular: false,
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Check login status
    const token = localStorage.getItem("accessToken")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      setIsLoggedIn(true)
      setUser(JSON.parse(userData))

      // Fetch subscription info
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data) {
            setSubscription(data)
          }
        })
        .catch(err => console.error('Failed to fetch subscription:', err))
    }
  }, [])

  const handleSubscribe = (planId: string) => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/pricing`)
      return
    }

    if (planId === "free") {
      // Check if user already has an active subscription (free or paid)
      if (subscription && subscription.status === 'active') {
        if (subscription.plan === 'free') {
          // Already on free plan
          toast.info("이미 무료 플랜을 이용 중입니다", {
            description: "대시보드에서 스캔을 시작해보세요!",
            action: {
              label: "대시보드로 이동",
              onClick: () => router.push("/dashboard")
            }
          })
        } else {
          // Currently on paid plan, cannot downgrade to free directly
          const planNames: Record<string, string> = {
            'starter': 'Starter',
            'pro': 'Pro',
            'business': 'Business',
            'enterprise': 'Enterprise',
          }
          const currentPlanName = planNames[subscription.plan] || subscription.plan.toUpperCase()

          toast.error("무료 플랜으로 변경할 수 없습니다", {
            description: `현재 ${currentPlanName} 플랜을 이용 중입니다. 무료 플랜으로 변경하려면 대시보드에서 구독을 취소해주세요.`,
            action: {
              label: "대시보드로 이동",
              onClick: () => router.push("/dashboard")
            }
          })
        }
        return
      }
      // No active subscription, redirect to dashboard (free plan will be auto-assigned)
      router.push("/dashboard")
      return
    }

    // Redirect to subscription checkout
    router.push(`/subscription/checkout?plan=${planId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    setUser(null)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VibeScan
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost">대시보드</Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-gray-300"
                  >
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">로그인</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      시작하기
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
            프로젝트에 맞는 구독 플랜
          </h1>
          <p className="text-xl text-gray-600">
            무료부터 엔터프라이즈까지, 모든 규모의 프로젝트를 위한 플랜
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  plan.popular
                    ? "border-2 border-blue-500 shadow-xl scale-105"
                    : "border border-gray-200"
                } hover:shadow-2xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      가장 인기있는
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${plan.color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? "₩0" : `₩${plan.price.toLocaleString()}`}
                    </span>
                    <span className="text-sm text-gray-600">/{plan.period}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    월 {plan.scans}회 스캔
                  </div>
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full mb-6 ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  {plan.id === "free" ? "무료 시작하기" : "구독하기"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-1 bg-gradient-to-r ${plan.color}`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Enterprise Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-gray-300">
                  대규모 조직을 위한 맞춤형 솔루션. 무제한 스캔, 전담 지원, SLA 보장
                </p>
              </div>
              <Button
                onClick={() => window.location.href = "mailto:ggprgrkjh2@gmail.com"}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                문의하기
              </Button>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">구독은 언제든지 취소할 수 있나요?</h3>
              <p className="text-gray-600">
                네, 언제든지 구독을 취소할 수 있습니다. 취소 시 다음 결제일까지 서비스를 계속 이용하실 수 있습니다.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">플랜을 중간에 변경할 수 있나요?</h3>
              <p className="text-gray-600">
                네, 대시보드에서 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer - Detailed Company Info */}
      <footer className="border-t border-gray-200 bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">회사 정보</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">회사명:</span> silverithm</p>
                <p><span className="font-semibold text-gray-900">대표자:</span> 김준형</p>
                <p><span className="font-semibold text-gray-900">사업자등록번호:</span> 107-21-26475</p>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">연락처</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">주소:</span><br/>서울특별시 관악구 신림동 1547-10</p>
                <p><span className="font-semibold text-gray-900">이메일:</span><br/><a href="mailto:ggprgrkjh2@gmail.com" className="hover:text-blue-600 transition-colors">ggprgrkjh2@gmail.com</a></p>
                <p><span className="font-semibold text-gray-900">전화번호:</span> 010-4549-2094</p>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">법적 고지</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><Link href="/privacy" className="hover:text-gray-900 transition-colors">개인정보 처리방침</Link></div>
                <div><Link href="/terms" className="hover:text-gray-900 transition-colors">서비스 이용약관</Link></div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">바로가기</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><Link href="/pricing" className="hover:text-gray-900 transition-colors">요금제</Link></div>
                <div><Link href="/dashboard" className="hover:text-gray-900 transition-colors">대시보드</Link></div>
                <div><a href="mailto:ggprgrkjh2@gmail.com" className="hover:text-gray-900 transition-colors">문의하기</a></div>
              </div>
            </div>
          </div>

          {/* Logo and Copyright */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="VibeScan 로고"
                  width={28}
                  height={28}
                  className="w-7 h-7"
                />
                <span className="text-xl font-semibold text-gray-900">VibeScan</span>
              </Link>
              <p className="text-sm text-gray-500">© 2025 VibeScan by silverithm. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
