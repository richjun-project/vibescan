"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import Image from "next/image"
import { Shield, TrendingUp, Clock, AlertTriangle, Ticket, CreditCard, Sparkles, Eye, EyeOff } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion, useInView, useSpring, useTransform } from "framer-motion"
import RankingScroller from "@/components/RankingScroller"

interface Scan {
  id: number
  domain: string
  status: string
  score?: number
  grade?: string
  createdAt: string
  completedAt?: string
  isRankingShared?: boolean
  results?: {
    findingsBySeverity?: {
      critical?: number
      high?: number
      medium?: number
      low?: number
      info?: number
    }
  }
}

interface SubscriptionInfo {
  plan: string
  status: string
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string
  nextBillingDate?: string
}

interface User {
  id: number
  email: string
  name: string
  subscriptionPlan?: string
  monthlyScansLimit?: number
  usedScans?: number
  remainingScans?: number
  subscriptionStatus?: string
  nextBillingDate?: string
}

// Animated Number Component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const spring = useSpring(0, { stiffness: 100, damping: 30 })
  const display = useTransform(spring, (current) => Math.round(current))
  const [finalValue, setFinalValue] = useState(value)

  useEffect(() => {
    if (isInView) {
      spring.set(value)
    }
  }, [isInView, spring, value])

  useEffect(() => {
    const unsubscribe = display.on("change", (latest) => {
      setFinalValue(latest)
    })
    return () => unsubscribe()
  }, [display])

  return <motion.span ref={ref}>{finalValue}</motion.span>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [domain, setDomain] = useState("")
  const [isRankingShared, setIsRankingShared] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalScans, setTotalScans] = useState(0)
  const SCANS_PER_PAGE = 10

  // Calculate available scans from subscription
  const remainingScans = user?.remainingScans || 0
  const monthlyLimit = user?.monthlyScansLimit || 1
  const usedScans = user?.usedScans || 0
  const subscriptionPlan = user?.subscriptionPlan || 'free'

  // Scroll detection for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchUserProfile()
    fetchSubscription()
    fetchScans()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const fetchUserProfile = async () => {
    try {
      const data = await apiClient.getProfile() as User
      setUser(data)
      localStorage.setItem("user", JSON.stringify(data))
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("사용자 정보를 불러올 수 없습니다")
    }
  }

  const fetchSubscription = async () => {
    try {
      const data = await apiClient.getSubscription() as SubscriptionInfo
      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const fetchScans = async (page: number = 1) => {
    try {
      const data = await apiClient.getScans(page, SCANS_PER_PAGE) as {
        scans: Scan[]
        total: number
        page: number
        limit: number
        totalPages: number
      }
      setScans(data.scans)
      setTotalPages(data.totalPages)
      setTotalScans(data.total)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching scans:", error)
      toast.error("스캔 기록을 불러올 수 없습니다")
    } finally {
      setLoading(false)
    }
  }

  const createScan = async (e: React.FormEvent) => {
    e.preventDefault()

    // URL 형식 검증
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
    const trimmedDomain = domain.trim()

    if (!trimmedDomain) {
      toast.error("도메인을 입력해주세요", {
        description: "예: example.com 또는 https://example.com",
      })
      return
    }

    if (!urlPattern.test(trimmedDomain)) {
      toast.error("잘못된 도메인 형식입니다", {
        description: "올바른 형식: example.com 또는 https://example.com",
      })
      return
    }

    // Block scanning of own domain
    const normalizedDomain = trimmedDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const blockedDomains = [
      'ourvibescan.netlify.app',
      'vibescan.kr',
      'www.vibescan.kr',
      'vibescan.co.kr',
      'www.vibescan.co.kr',
      'localhost',
    ]

    if (blockedDomains.some(blocked => normalizedDomain.includes(blocked))) {
      toast.error("이 도메인은 스캔할 수 없습니다", {
        description: "VibeScan 자체 도메인은 스캔이 제한됩니다.",
      })
      return
    }

    // 중복 스캔 체크 (진행 중인 스캔)
    const existingActiveScan = scans.find(
      s => s.domain === trimmedDomain && (s.status === 'pending' || s.status === 'running')
    )
    if (existingActiveScan) {
      toast.error("이미 진행 중인 스캔이 있습니다", {
        description: `"${trimmedDomain}" 도메인의 스캔이 진행 중입니다.`,
        action: {
          label: "보기",
          onClick: () => router.push(`/scans/${existingActiveScan.id}`)
        }
      })
      return
    }

    // Check if user has remaining scans
    if (remainingScans <= 0) {
      toast.error("스캔 횟수 부족", {
        description: subscriptionPlan === 'free'
          ? "무료 플랜의 월간 스캔을 모두 사용했습니다. Pro 플랜으로 업그레이드하세요."
          : "이번 달 스캔을 모두 사용했습니다. 다음 달까지 기다리거나 플랜을 업그레이드하세요.",
        action: {
          label: "업그레이드",
          onClick: () => router.push("/pricing")
        }
      })
      return
    }

    setCreating(true)

    try {
      const newScan = await apiClient.createScan(trimmedDomain, undefined, 'ko', isRankingShared)
      setDomain("")
      setIsRankingShared(false)

      toast.success("스캔 시작!", {
        description: "스캔 진행 상황 페이지로 이동합니다. 브라우저를 닫아도 스캔은 계속 진행됩니다.",
        duration: 2000,
      })

      // Refresh user profile
      await fetchUserProfile()

      // Redirect to scan detail page after short delay
      setTimeout(() => {
        router.push(`/scans/${newScan.id}`)
      }, 1500)
    } catch (error: any) {
      const errorMessage = error.message || "알 수 없는 오류가 발생했습니다"

      // Handle specific error cases
      if (errorMessage.includes("이미 진행 중인 스캔")) {
        toast.error("이미 진행 중인 스캔이 있습니다", {
          description: "현재 스캔이 완료된 후 다시 시도해주세요.",
          action: {
            label: "스캔 목록",
            onClick: () => window.location.reload()
          }
        })
      } else if (errorMessage.includes("limit") || errorMessage.includes("모두 사용")) {
        toast.error("스캔 한도 초과", {
          description: errorMessage,
          action: {
            label: "업그레이드",
            onClick: () => router.push("/pricing")
          }
        })
      } else if (errorMessage.includes("도메인은 스캔할 수 없습니다")) {
        toast.error("스캔 불가", {
          description: errorMessage,
        })
      } else if (errorMessage.includes("invalid") || errorMessage.includes("형식")) {
        toast.error("잘못된 도메인", {
          description: "도메인 형식이 올바르지 않습니다.",
        })
      } else {
        toast.error("스캔 생성 실패", {
          description: errorMessage || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        })
      }
    } finally {
      setCreating(false)
    }
  }

  const toggleRankingShared = async (scanId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const result = await apiClient.toggleRankingShared(scanId)

      // Update local state
      setScans(scans.map(scan =>
        scan.id === scanId
          ? { ...scan, isRankingShared: result.isRankingShared }
          : scan
      ))

      toast.success(
        result.isRankingShared
          ? "스캔이 공개 랭킹에 공유됩니다"
          : "스캔이 랭킹에서 비공개 처리됩니다"
      )
    } catch (error: any) {
      toast.error("랭킹 공유 설정 변경 실패", {
        description: error.message || "잠시 후 다시 시도해주세요"
      })
    }
  }

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      await apiClient.cancelSubscription()

      toast.success("구독 취소 예약 완료", {
        description: "구독 기간이 끝날 때까지 서비스를 계속 이용하실 수 있습니다.",
      })

      // Refresh subscription data
      await fetchSubscription()
      await fetchUserProfile()

      setCancelDialogOpen(false)
    } catch (error: any) {
      console.error("Cancel subscription error:", error)
      toast.error("구독 취소 실패", {
        description: error.message || "잠시 후 다시 시도해주세요.",
      })
    } finally {
      setCanceling(false)
    }
  }

  const handleResumeSubscription = async () => {
    try {
      await apiClient.resumeSubscription()

      toast.success("구독 재개 완료", {
        description: "구독이 정상적으로 재개되었습니다.",
      })

      // Refresh subscription data
      await fetchSubscription()
      await fetchUserProfile()
    } catch (error: any) {
      console.error("Resume subscription error:", error)
      toast.error("구독 재개 실패", {
        description: error.message || "잠시 후 다시 시도해주세요.",
      })
    }
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken")

    // Call logout endpoint to revoke refresh token
    if (refreshToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    // Clear all local storage
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")

    toast.success("로그아웃되었습니다")
    router.push("/")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      completed: { className: "bg-green-100 text-green-700 hover:bg-green-100 border border-green-300", label: "완료" },
      running: { className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300", label: "실행 중" },
      pending: { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border border-yellow-300", label: "대기 중" },
      failed: { className: "bg-red-100 text-red-700 hover:bg-red-100 border border-red-300", label: "실패" },
    }

    const config = statusConfig[status] || { className: "bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-300", label: status }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getGradeBadge = (grade?: string) => {
    if (!grade) return null

    const gradeConfig: Record<string, { className: string }> = {
      A: { className: "bg-green-100 text-green-700 hover:bg-green-100 border border-green-300" },
      B: { className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300" },
      C: { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border border-yellow-300" },
      D: { className: "bg-red-100 text-red-700 hover:bg-red-100 border border-red-300" },
    }

    const config = gradeConfig[grade] || { className: "" }
    return <Badge className={config.className}>{grade} 등급</Badge>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <header className="border-b border-gray-100">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-6xl">
          {/* Stats Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-2">
              <Card className="border-2 rounded-2xl">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            </div>
            {[1, 2].map((i) => (
              <Card key={i} className="border-2 rounded-2xl">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* New Scan Skeleton */}
          <Card className="mb-8 border-2 rounded-3xl">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="flex-1 h-24" />
                  <Skeleton className="flex-1 h-24" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="flex-1 h-10" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scans List Skeleton */}
          <Card className="border-2 rounded-2xl">
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-2xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-blue-100/30 relative overflow-hidden">
      {/* Decorative Background Elements - Blue Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300/15 to-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-sky-400/15 rounded-full blur-3xl" />
      </div>

      {/* Clean Header with backdrop blur */}
      <motion.header
        className={cn(
          "border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300",
          scrolled ? "border-gray-200 shadow-lg shadow-gray-200/50" : "border-gray-100"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="VibeScan 로고"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-xl font-semibold text-gray-900">
                VibeScan
              </h1>
            </Link>
            <div className="flex items-center gap-6">
              <div className="text-sm text-right hidden sm:block">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  document.cookie = "user-lang-preference=en; path=/; max-age=31536000"
                  window.location.href = "/en/dashboard"
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                🇺🇸 English
              </button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full text-gray-600 hover:text-gray-900">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-12 max-w-6xl relative z-10">
        {/* Hero Section with Gradient Text */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-900 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            대시보드
            <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
          </h1>
          <p className="text-gray-600 font-medium">보안 스캔 현황을 확인하고 새로운 스캔을 시작하세요</p>
        </motion.div>

        {/* Stats Grid - Unified Subscription Card + Other Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* UNIFIED SUBSCRIPTION CARD - Spans 2 columns */}
          <motion.div
            className="p-6 border-2 rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 md:col-span-2 relative overflow-hidden backdrop-blur-sm border-gray-400 hover:border-gray-600 bg-white/90 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4 }}
          >
            {/* Header with Plan Badge */}
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gray-100"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Shield className="w-6 h-6 text-gray-900" />
                </motion.div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">구독 플랜</p>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge className={cn(
                      "mt-1.5 capitalize font-semibold shadow-sm",
                      subscriptionPlan === 'free'
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-100 border border-purple-300"
                    )}>
                      {subscriptionPlan === 'free'
                        ? 'Free Plan'
                        : subscriptionPlan === 'starter'
                        ? 'Starter Plan'
                        : subscriptionPlan === 'pro'
                        ? 'Pro Plan'
                        : subscriptionPlan === 'business'
                        ? 'Business Plan'
                        : 'Enterprise Plan'}
                    </Badge>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Quota Display with Visual Progress */}
            <div className="mb-5 relative z-10">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-5xl font-extrabold text-gray-900 tabular-nums">
                  <AnimatedNumber value={remainingScans} />
                </span>
                <span className="text-lg text-gray-600 font-semibold">
                  / <AnimatedNumber value={monthlyLimit} />회
                </span>
                <span className="text-sm text-gray-500 ml-1 font-medium">
                  남음
                </span>
              </div>

              {/* Progress Bar with Animation */}
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    remainingScans === 0
                      ? "bg-gradient-to-r from-red-500 via-red-600 to-red-500"
                      : remainingScans <= monthlyLimit * 0.2
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
                      : "bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max((remainingScans / monthlyLimit) * 100, 3)}%` }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                  style={{
                    backgroundSize: "200% 100%",
                    animation: "shimmer 3s infinite"
                  }}
                />
              </div>

              {/* Status Message */}
              {remainingScans === 0 ? (
                <div className="flex items-start gap-2 mt-4 p-3 bg-red-100 border border-red-300 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-800 leading-relaxed">
                    스캔 횟수가 모두 소진되었습니다. 플랜을 업그레이드하거나 다음 달을 기다려주세요.
                  </p>
                </div>
              ) : remainingScans <= monthlyLimit * 0.2 ? (
                <div className="flex items-start gap-2 mt-4 p-3 bg-amber-100 border border-amber-300 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-medium text-amber-800 leading-relaxed">
                    스캔 횟수가 얼마 남지 않았습니다. 추가 스캔이 필요하시면 플랜 업그레이드를 고려해보세요.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-600 font-medium">
                    이번 달 사용: <span className="text-gray-900 font-semibold">{usedScans}/{monthlyLimit}회</span>
                  </p>
                  {subscriptionPlan !== 'free' && subscription?.nextBillingDate && (
                    <p className="text-xs text-gray-500">
                      다음 갱신: {new Date(subscription.nextBillingDate).toLocaleDateString("ko-KR", {
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cancellation Notice */}
            {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-900">
                    <p className="font-semibold mb-1">구독 취소 예정</p>
                    <p>
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      까지 서비스를 이용하실 수 있습니다
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Contextual based on plan */}
            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-200">
              {subscriptionPlan === 'free' ? (
                <>
                  <Link href="/pricing" className="flex-1 min-w-[140px]">
                    <Button
                      size="sm"
                      className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Pro로 업그레이드
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="sm" variant="outline" className="rounded-full text-gray-700 border-gray-300 hover:bg-gray-100 font-medium">
                      플랜 비교
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/pricing" className="flex-1 min-w-[120px]">
                    <Button size="sm" variant="outline" className="w-full rounded-full border-gray-300 hover:bg-gray-100 font-medium">
                      플랜 변경
                    </Button>
                  </Link>
                  {subscription?.cancelAtPeriodEnd ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-green-300 text-green-700 bg-green-50 hover:bg-green-100 font-medium"
                      onClick={handleResumeSubscription}
                    >
                      취소 철회
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      구독 취소
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Total Scans Card */}
          <motion.div
            className="p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-400 rounded-2xl hover:border-gray-600 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <motion.div
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <Clock className="w-5 h-5 text-gray-900" />
              </motion.div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">총 스캔</p>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1 tabular-nums relative z-10">
              <AnimatedNumber value={scans.length} />회
            </div>
            <p className="text-sm text-gray-500 font-medium relative z-10">전체 기간</p>
          </motion.div>

          {/* Completed Scans Card */}
          <motion.div
            className="p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-400 rounded-2xl hover:border-gray-600 hover:shadow-xl hover:shadow-green-200/50 hover:scale-[1.03] transition-all duration-300 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -4 }}
          >
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <motion.div
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <TrendingUp className="w-5 h-5 text-gray-900" />
              </motion.div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">완료된 스캔</p>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1 tabular-nums relative z-10">
              <AnimatedNumber value={scans.filter(s => s.status === 'completed').length} />회
            </div>
            <p className="text-sm text-gray-600 font-medium relative z-10">
              성공률: <span className="font-bold text-green-600"><AnimatedNumber value={scans.length > 0 ? Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100) : 0} />%</span>
            </p>
          </motion.div>
        </div>

        {/* New Scan Section - Enhanced with Rounded Design */}
        <motion.div
          className="mb-12 p-8 bg-white/90 backdrop-blur-sm border-2 border-gray-400 rounded-3xl shadow-xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                새 보안 스캔
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Shield className="w-6 h-6 text-blue-600" />
                </motion.div>
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                도메인을 입력하여 보안 취약점을 검사하세요
                {remainingScans > 0 && (
                  <span className="ml-1">
                    • <span className="font-semibold text-blue-700">{remainingScans}회 사용 가능</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-400 shadow-lg relative z-10">
            <form onSubmit={createScan} className="space-y-4">
              <div className="flex gap-3">
                <Input
                  id="domain-input"
                  placeholder="example.com 또는 https://example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  disabled={remainingScans === 0}
                  aria-required="true"
                  aria-describedby="domain-hint"
                  className={cn(
                    "flex-1 h-14 text-base border-2 rounded-xl px-5 transition-all duration-300",
                    remainingScans === 0
                      ? "bg-gray-100 cursor-not-allowed"
                      : "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-200/50"
                  )}
                />
                <span id="domain-hint" className="sr-only">
                  스캔할 웹사이트의 도메인 주소를 입력하세요. 예: example.com
                </span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    size="lg"
                    disabled={creating || remainingScans === 0}
                    className="px-10 h-14 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white font-bold min-w-[140px] shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
                    style={{
                      backgroundSize: "200% 100%",
                      animation: creating ? "shimmer 2s infinite" : undefined
                    }}
                    aria-busy={creating}
                  >
                    {creating ? (
                      <>
                        <span>생성 중...</span>
                        <span className="sr-only">스캔을 생성하는 중입니다</span>
                      </>
                    ) : "스캔 시작"}
                  </Button>
                </motion.div>
              </div>

              <div className="flex items-center gap-2 pl-1">
                <input
                  type="checkbox"
                  id="ranking-share"
                  checked={isRankingShared}
                  onChange={(e) => setIsRankingShared(e.target.checked)}
                  disabled={remainingScans === 0}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="ranking-share"
                  className={cn(
                    "text-sm font-medium cursor-pointer select-none",
                    remainingScans === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:text-blue-600"
                  )}
                >
                  스캔 결과를 공개 랭킹에 공유하기
                </label>
              </div>
            </form>

            {remainingScans === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <p className="text-sm text-amber-900 font-medium">
                  스캔 횟수를 모두 사용했습니다.
                  <Link href="/pricing" className="font-semibold underline ml-1 hover:text-amber-950">
                    플랜 업그레이드
                  </Link>
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Ranking Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-12"
        >
          <RankingScroller />
        </motion.div>

        {/* Scans List - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">스캔 기록</h2>
          <p className="text-sm text-gray-500 mb-6">
            {totalScans > 0
              ? `총 ${totalScans}개의 스캔 기록`
              : "아직 스캔 기록이 없습니다"}
          </p>
          <div>
            {scans.length === 0 ? (
              <div className="text-center py-20 p-8 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-3xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  첫 번째 스캔을 시작해보세요
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  도메인을 입력하고 종합적인 보안 분석 리포트를 받아보세요
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <span>보안 취약점 탐지</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>상세 분석 리포트</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>실시간 모니터링</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {scans.map((scan, index) => (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link
                      href={`/scans/${scan.id}`}
                      className="block group"
                    >
                      <motion.div
                        className="flex items-center justify-between p-5 bg-white/80 backdrop-blur-sm border-2 border-gray-400 rounded-2xl hover:border-gray-600 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                        whileHover={{ y: -2, scale: 1.01 }}
                      >
                        <div className="flex-1 min-w-0 relative z-10">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 truncate text-lg">
                              {scan.domain}
                            </h3>
                            {getStatusBadge(scan.status)}
                            {scan.status !== 'failed' && scan.grade && getGradeBadge(scan.grade)}
                            {scan.status === 'completed' && scan.isRankingShared && (
                              <Badge className="bg-gray-900 text-white hover:bg-gray-900 border border-gray-900 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                랭킹 공개
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              {new Date(scan.createdAt).toLocaleString("ko-KR", {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {scan.score !== undefined && (
                              <span className="font-bold text-gray-900">
                                점수: {scan.score}/100
                              </span>
                            )}
                          </div>
                          {scan.results?.findingsBySeverity && (
                            <div className="flex items-center gap-2 mt-2 text-xs">
                              {(scan.results.findingsBySeverity.critical ?? 0) > 0 && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                  Critical: {scan.results.findingsBySeverity.critical}
                                </span>
                              )}
                              {(scan.results.findingsBySeverity.high ?? 0) > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                                  High: {scan.results.findingsBySeverity.high}
                                </span>
                              )}
                              {(scan.results.findingsBySeverity.medium ?? 0) > 0 && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                                  Medium: {scan.results.findingsBySeverity.medium}
                                </span>
                              )}
                              {(scan.results.findingsBySeverity.low ?? 0) > 0 && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                  Low: {scan.results.findingsBySeverity.low}
                                </span>
                              )}
                              {(scan.results.findingsBySeverity.info ?? 0) > 0 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                  Info: {scan.results.findingsBySeverity.info}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity relative z-10">
                          {scan.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => toggleRankingShared(scan.id, e)}
                              className="rounded-full bg-white border-2 border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1"
                            >
                              {scan.isRankingShared ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  비공개
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  랭킹 공유
                                </>
                              )}
                            </Button>
                          )}
                          <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Button variant="ghost" size="sm" className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                              상세보기 →
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchScans(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all"
                >
                  이전
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first, last, current, and adjacent pages
                  const isFirstOrLast = page === 1 || page === totalPages
                  const isNearCurrent = Math.abs(page - currentPage) <= 1
                  const shouldShow = isFirstOrLast || isNearCurrent

                  if (!shouldShow) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 text-gray-400">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "primary" : "outline"}
                      size="sm"
                      onClick={() => fetchScans(page)}
                      className={cn(
                        "rounded-full w-10 h-10 transition-all border-2",
                        currentPage === page
                          ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
                          : "border-gray-300 hover:border-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {page}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchScans(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all"
                >
                  다음
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">구독을 취소하시겠습니까?</DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              구독을 취소하면 다음과 같이 처리됩니다:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-2">취소 시 유의사항</p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>현재 구독 기간이 끝날 때까지 서비스를 정상적으로 이용하실 수 있습니다</li>
                    <li>구독 기간 종료 후 자동 결제가 중단됩니다</li>
                    <li>종료 후에는 Free 플랜으로 자동 전환됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">현재 구독 종료일</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  이 날짜까지 {subscriptionPlan === 'pro' ? 'Pro' : subscriptionPlan === 'business' ? 'Business' : 'Enterprise'} 플랜을 사용하실 수 있습니다
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={canceling}
              className="rounded-full border-2"
            >
              유지하기
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              {canceling ? "처리 중..." : "구독 취소"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer - Detailed Company Info */}
      <footer className="border-t border-gray-200 bg-gray-50 py-16 mt-20">
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

