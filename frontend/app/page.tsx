"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { Shield, Zap, Award, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Code, Lock, Rocket, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("accessToken")
    setIsLoggedIn(!!token)

    if (token) {
      // Fetch subscription info
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/current`, {
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

  const handleFreePlanClick = () => {
    if (!isLoggedIn) {
      router.push("/register")
      return
    }

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
        // Currently on paid plan
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

    // No active subscription, redirect to dashboard
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Apple Style with Mobile Nav */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 min-h-[56px]">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="VibeScan 로고"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-gray-900">VibeScan</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/pricing" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
                요금제
              </Link>
              <Link
                href="/en"
                className="text-sm text-gray-900 hover:text-gray-600 transition-colors"
                onClick={() => {
                  document.cookie = "user-lang-preference=en; path=/; max-age=31536000"
                }}
              >
                🇺🇸 English
              </Link>
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                    대시보드
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
                    로그인
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      시작하기
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" aria-label="메뉴 열기">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>메뉴</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <Link
                    href="/pricing"
                    className="text-base text-gray-900 hover:text-gray-600 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg"
                  >
                    요금제
                  </Link>
                  <Link
                    href="/en"
                    className="text-base text-gray-900 hover:text-gray-600 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg"
                    onClick={() => {
                      document.cookie = "user-lang-preference=en; path=/; max-age=31536000"
                    }}
                  >
                    🇺🇸 English
                  </Link>
                  {isLoggedIn ? (
                    <Link href="/dashboard" className="mt-2">
                      <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        대시보드
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="text-base text-gray-900 hover:text-gray-600 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg"
                      >
                        로그인
                      </Link>
                      <Link href="/register" className="mt-2">
                        <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                          시작하기
                        </Button>
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </header>

      {/* Hero Section - Apple Style */}
      <section
        className="container mx-auto px-6 py-20 md:py-32 relative rounded-3xl overflow-hidden"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-12 md:px-12 md:py-16 shadow-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-900 mb-6 tracking-tight leading-tight">
              웹 보안 점검,<br />이제는 간단하게
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              12,000+ 취약점 패턴과 AI 분석으로<br className="hidden md:block" />
              프로덕션 환경을 5분 안에 보호하세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg">
                  {isLoggedIn ? "대시보드로 이동" : "무료로 시작하기"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>엔터프라이즈급 보안 검증</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>5분 이내 완료</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>12,000+ 취약점 패턴</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Apple Style */}
      <section className="container mx-auto px-6 py-20 md:py-32 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
              강력한 보안 분석 엔진
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              엔터프라이즈급 보안 검증으로 프로덕션 환경을 보호하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-gray-50 border-0 hover:bg-gray-100 transition-all duration-150">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  12,000+ 취약점 패턴
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  매일 업데이트되는 대규모 취약점 데이터베이스로 OWASP Top 10, 최신 CVE, Zero-Day 취약점까지 완벽 탐지합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">SQL Injection</span>
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">XSS</span>
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">CSRF</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-gray-50 border-0 hover:bg-gray-100 transition-all duration-150">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  실시간 웹 취약점 스캐닝
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Nuclei, ZAP 등 업계 최고 수준의 스캐너로 웹 애플리케이션의 보안 취약점을 실시간 탐지합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">Nuclei</span>
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">ZAP</span>
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">SSL/TLS</span>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-gray-50 border-0 hover:bg-gray-100 transition-all duration-150">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  500+ 시크릿 키 노출 탐지
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  500+ 시크릿 패턴 인식으로 AWS, GCP, Azure, Stripe 등 모든 클라우드 서비스 키를 탐지하여 유출을 사전 차단합니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">AWS Keys</span>
                  <span className="text-xs px-3 py-1 bg-white text-gray-600 rounded-full font-medium">API Tokens</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features - Apple Style */}
      <section className="container mx-auto px-6 py-20 md:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              실시간 자동 업데이트
            </h3>
            <p className="text-gray-500 leading-relaxed">
              최신 보안 위협에 대응하기 위해 취약점 규칙이 매일 자동으로 업데이트됩니다.
              신규 CVE 등록 24시간 이내 탐지 가능합니다.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              AI 기반 우선순위 분석
            </h3>
            <p className="text-gray-500 leading-relaxed">
              수백 개의 취약점 중 비즈니스에 실제 영향을 주는 것만 우선 수정하도록 AI가 가이드합니다.
              복사-붙여넣기로 바로 적용 가능한 코드를 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section - Apple Style */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
              프로젝트에 맞는 구독 플랜
            </h2>
            <p className="text-xl text-gray-500">
              무료로 시작하고, 필요에 따라 플랜을 업그레이드하세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {/* Free Plan */}
            <Card className="p-6 border border-gray-200 hover:border-gray-300 transition-all duration-150">
              <div className="mb-5">
                <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Free</h3>
                <div className="mb-1">
                  <span className="text-2xl font-semibold text-gray-900">₩0</span>
                  <span className="text-gray-500 text-xs font-medium">/월</span>
                </div>
                <p className="text-xs text-gray-500">개인 프로젝트용</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900">월 1회 스캔</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900">리포트 미리보기</span>
                </li>
              </ul>

              <Button
                onClick={handleFreePlanClick}
                variant="secondary"
                className="w-full rounded-full text-sm"
              >
                무료 시작
              </Button>
            </Card>

            {/* Starter Plan */}
            <Card className="p-6 border border-gray-200 hover:border-gray-300 transition-all duration-150">
              <div className="mb-5">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Starter</h3>
                <div className="mb-1">
                  <span className="text-2xl font-semibold text-gray-900">₩9,900</span>
                  <span className="text-gray-500 text-xs font-medium">/월</span>
                </div>
                <p className="text-xs text-gray-500">소규모 프로젝트</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">월 5회 스캔</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">전체 리포트</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">AI 분석</span>
                </li>
              </ul>

              <Link href="/pricing">
                <Button variant="secondary" className="w-full rounded-full text-sm">
                  구독하기
                </Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="p-6 border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-150 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  추천
                </span>
              </div>

              <div className="mb-5">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Pro</h3>
                <div className="mb-1">
                  <span className="text-2xl font-semibold text-gray-900">₩29,900</span>
                  <span className="text-gray-500 text-xs font-medium">/월</span>
                </div>
                <p className="text-xs text-gray-500">개발자 & 팀</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">월 10회 스캔</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">전체 리포트</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">AI 분석</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">우선 지원</span>
                </li>
              </ul>

              <Link href="/pricing">
                <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm">
                  구독하기
                </Button>
              </Link>
            </Card>

            {/* Business Plan */}
            <Card className="p-6 border border-gray-200 hover:border-gray-300 transition-all duration-150">
              <div className="mb-5">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mb-3">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Business</h3>
                <div className="mb-1">
                  <span className="text-2xl font-semibold text-gray-900">₩99,900</span>
                  <span className="text-gray-500 text-xs font-medium">/월</span>
                </div>
                <p className="text-xs text-gray-500">기업용</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">월 50회 스캔</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">전체 리포트</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">AI 분석</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">전담 지원</span>
                </li>
              </ul>

              <Link href="/pricing">
                <Button variant="secondary" className="w-full rounded-full text-sm">
                  구독하기
                </Button>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">
              모든 플랜 비교하기 →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Apple Style */}
      <section className="container mx-auto px-6 py-20 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-6xl font-semibold text-gray-900 mb-2">
                12,000+
              </div>
              <div className="text-gray-500">취약점 패턴</div>
            </div>
            <div>
              <div className="text-6xl font-semibold text-gray-900 mb-2">
                500+
              </div>
              <div className="text-gray-500">시크릿 키 탐지</div>
            </div>
            <div>
              <div className="text-6xl font-semibold text-gray-900 mb-2">
                5분
              </div>
              <div className="text-gray-500">스캔 완료</div>
            </div>
          </div>
        </div>
      </section>

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
