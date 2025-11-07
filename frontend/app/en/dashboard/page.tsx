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
import { Shield, TrendingUp, Clock, AlertTriangle, Ticket, CreditCard, Sparkles } from "lucide-react"
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

export default function DashboardPageEN() {
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
      router.push("/en/login")
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
      toast.error("Failed to load user information")
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
      toast.error("Failed to load scan history")
    } finally {
      setLoading(false)
    }
  }

  const createScan = async (e: React.FormEvent) => {
    e.preventDefault()

    // URL format validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
    const trimmedDomain = domain.trim()

    if (!trimmedDomain) {
      toast.error("Please enter a domain", {
        description: "Example: example.com or https://example.com",
      })
      return
    }

    if (!urlPattern.test(trimmedDomain)) {
      toast.error("Invalid domain format", {
        description: "Correct format: example.com or https://example.com",
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
      toast.error("This domain cannot be scanned", {
        description: "Scanning VibeScan's own domains is restricted.",
      })
      return
    }

    // Check for duplicate scans (active scans)
    const existingActiveScan = scans.find(
      s => s.domain === trimmedDomain && (s.status === 'pending' || s.status === 'running')
    )
    if (existingActiveScan) {
      toast.error("Scan already in progress", {
        description: `A scan for "${trimmedDomain}" is already running.`,
        action: {
          label: "View",
          onClick: () => router.push(`/en/scans/${existingActiveScan.id}`)
        }
      })
      return
    }

    // Check if user has remaining scans
    if (remainingScans <= 0) {
      toast.error("Insufficient scans", {
        description: subscriptionPlan === 'free'
          ? "You've used all monthly scans in the free plan. Upgrade to Pro plan."
          : "You've used all scans for this month. Wait until next month or upgrade your plan.",
        action: {
          label: "Upgrade",
          onClick: () => router.push("/en/pricing")
        }
      })
      return
    }

    setCreating(true)

    try {
      const newScan = await apiClient.createScan(trimmedDomain, undefined, 'en', isRankingShared)
      setDomain("")
      setIsRankingShared(false)

      toast.success("Scan started!", {
        description: "Redirecting to scan progress page. You can close your browser - the scan will continue in the background.",
        duration: 2000,
      })

      // Refresh user profile
      await fetchUserProfile()

      // Redirect to scan detail page after short delay
      setTimeout(() => {
        router.push(`/en/scans/${newScan.id}`)
      }, 1500)
    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred"

      // Handle specific error cases
      if (errorMessage.includes("already in progress") || errorMessage.includes("이미 진행 중인 스캔")) {
        toast.error("Scan already in progress", {
          description: "Please wait for the current scan to complete.",
          action: {
            label: "Scan List",
            onClick: () => window.location.reload()
          }
        })
      } else if (errorMessage.includes("limit") || errorMessage.includes("모두 사용")) {
        toast.error("Scan limit exceeded", {
          description: errorMessage,
          action: {
            label: "Upgrade",
            onClick: () => router.push("/en/pricing")
          }
        })
      } else if (errorMessage.includes("cannot be scanned") || errorMessage.includes("스캔할 수 없습니다")) {
        toast.error("Scan not allowed", {
          description: errorMessage,
        })
      } else if (errorMessage.includes("invalid") || errorMessage.includes("형식")) {
        toast.error("Invalid domain", {
          description: "The domain format is incorrect.",
        })
      } else {
        toast.error("Failed to create scan", {
          description: errorMessage || "A server error occurred. Please try again later.",
        })
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCanceling(true)
    try {
      await apiClient.cancelSubscription()

      toast.success("Subscription cancellation scheduled", {
        description: "You can continue using the service until the end of your billing period.",
      })

      // Refresh subscription data
      await fetchSubscription()
      await fetchUserProfile()

      setCancelDialogOpen(false)
    } catch (error: any) {
      console.error("Cancel subscription error:", error)
      toast.error("Failed to cancel subscription", {
        description: error.message || "Please try again later.",
      })
    } finally {
      setCanceling(false)
    }
  }

  const handleResumeSubscription = async () => {
    try {
      await apiClient.resumeSubscription()

      toast.success("Subscription resumed", {
        description: "Your subscription has been successfully resumed.",
      })

      // Refresh subscription data
      await fetchSubscription()
      await fetchUserProfile()
    } catch (error: any) {
      console.error("Resume subscription error:", error)
      toast.error("Failed to resume subscription", {
        description: error.message || "Please try again later.",
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

    toast.success("Logged out successfully")
    router.push("/en")
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { className: string; label: string }> = {
      completed: { className: "bg-green-100 text-green-700 hover:bg-green-100 border border-green-300", label: "Completed" },
      running: { className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300", label: "Running" },
      pending: { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border border-yellow-300", label: "Pending" },
      failed: { className: "bg-red-100 text-red-700 hover:bg-red-100 border border-red-300", label: "Failed" },
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
    return <Badge className={config.className}>Grade {grade}</Badge>
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
            <Link href="/en" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="VibeScan Logo"
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
                  document.cookie = "user-lang-preference=ko; path=/; max-age=31536000"
                  window.location.href = "/dashboard"
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                🇰🇷 한국어
              </button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full text-gray-600 hover:text-gray-900">
                Logout
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
            Dashboard
            <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
          </h1>
          <p className="text-gray-600 font-medium">Check your security scan status and start new scans</p>
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
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription Plan</p>
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
                  / <AnimatedNumber value={monthlyLimit} />
                </span>
                <span className="text-sm text-gray-500 ml-1 font-medium">
                  remaining
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
                    All scans have been used. Please upgrade your plan or wait until next month.
                  </p>
                </div>
              ) : remainingScans <= monthlyLimit * 0.2 ? (
                <div className="flex items-start gap-2 mt-4 p-3 bg-amber-100 border border-amber-300 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <p className="text-xs font-medium text-amber-800 leading-relaxed">
                    Running low on scans. Consider upgrading your plan for additional scans.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-600 font-medium">
                    Used this month: <span className="text-gray-900 font-semibold">{usedScans}/{monthlyLimit}</span>
                  </p>
                  {subscriptionPlan !== 'free' && subscription?.nextBillingDate && (
                    <p className="text-xs text-gray-500">
                      Next renewal: {new Date(subscription.nextBillingDate).toLocaleDateString("en-US", {
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
                    <p className="font-semibold mb-1">Cancellation Scheduled</p>
                    <p>
                      You can use the service until{" "}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Contextual based on plan */}
            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-gray-200">
              {subscriptionPlan === 'free' ? (
                <>
                  <Link href="/en/pricing" className="flex-1 min-w-[140px]">
                    <Button
                      size="sm"
                      className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Upgrade to Pro
                    </Button>
                  </Link>
                  <Link href="/en/pricing">
                    <Button size="sm" variant="outline" className="rounded-full text-gray-700 border-gray-300 hover:bg-gray-100 font-medium">
                      Compare Plans
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/en/pricing" className="flex-1 min-w-[120px]">
                    <Button size="sm" variant="outline" className="w-full rounded-full border-gray-300 hover:bg-gray-100 font-medium">
                      Change Plan
                    </Button>
                  </Link>
                  {subscription?.cancelAtPeriodEnd ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-green-300 text-green-700 bg-green-50 hover:bg-green-100 font-medium"
                      onClick={handleResumeSubscription}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      Cancel
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Scans</p>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1 tabular-nums relative z-10">
              <AnimatedNumber value={scans.length} />
            </div>
            <p className="text-sm text-gray-500 font-medium relative z-10">All time</p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1 tabular-nums relative z-10">
              <AnimatedNumber value={scans.filter(s => s.status === 'completed').length} />
            </div>
            <p className="text-sm text-gray-600 font-medium relative z-10">
              Success rate: <span className="font-bold text-green-600"><AnimatedNumber value={scans.length > 0 ? Math.round((scans.filter(s => s.status === 'completed').length / scans.length) * 100) : 0} />%</span>
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
                New Security Scan
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Shield className="w-6 h-6 text-blue-600" />
                </motion.div>
              </h2>
              <p className="text-sm text-gray-600 font-medium">
                Enter a domain to check for security vulnerabilities
                {remainingScans > 0 && (
                  <span className="ml-1">
                    • <span className="font-semibold text-blue-700">{remainingScans} scans available</span>
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
                  placeholder="example.com or https://example.com"
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
                  Enter the domain of the website you want to scan. Example: example.com
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
                        <span>Creating...</span>
                        <span className="sr-only">Creating scan...</span>
                      </>
                    ) : "Start Scan"}
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
                  Share scan result in public ranking
                </label>
              </div>
            </form>

            {remainingScans === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                <p className="text-sm text-amber-900 font-medium">
                  You&apos;ve used all your scans.
                  <Link href="/en/pricing" className="font-semibold underline ml-1 hover:text-amber-950">
                    Upgrade plan
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
          <RankingScroller lang="en" />
        </motion.div>

        {/* Scans List - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Scan History</h2>
          <p className="text-sm text-gray-500 mb-6">
            {totalScans > 0
              ? `Total ${totalScans} scan records`
              : "No scan records yet"}
          </p>
          <div>
            {scans.length === 0 ? (
              <div className="text-center py-20 p-8 bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-dashed border-gray-300 rounded-3xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start your first scan
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Enter a domain and receive a comprehensive security analysis report
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-600" />
                    </div>
                    <span>Security Vulnerability Detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>Detailed Analysis Report</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-purple-600" />
                    </div>
                    <span>Real-time Monitoring</span>
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
                      href={`/en/scans/${scan.id}`}
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
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>
                              {new Date(scan.createdAt).toLocaleString("en-US", {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {scan.score !== undefined && (
                              <span className="font-bold text-gray-900">
                                Score: {scan.score}/100
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
                        <div className="ml-4 opacity-70 group-hover:opacity-100 transition-opacity relative z-10">
                          <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                            <Button variant="ghost" size="sm" className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium">
                              View Details →
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
                  Previous
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
                  Next
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
            <DialogTitle className="text-xl font-semibold">Cancel subscription?</DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              If you cancel your subscription, here&apos;s what will happen:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-2">Important Notes</p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>You can continue using the service until the end of your current billing period</li>
                    <li>Automatic billing will stop after the subscription period ends</li>
                    <li>You&apos;ll be automatically switched to the Free plan after the period ends</li>
                  </ul>
                </div>
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Current subscription end date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You can use the {subscriptionPlan === 'pro' ? 'Pro' : subscriptionPlan === 'business' ? 'Business' : 'Enterprise'} plan until this date
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
              Keep Subscription
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="rounded-full bg-gray-900 hover:bg-gray-800 text-white"
            >
              {canceling ? "Processing..." : "Cancel Subscription"}
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
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Company</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">Name:</span> silverithm</p>
                <p><span className="font-semibold text-gray-900">CEO:</span> Junhyeong Kim</p>
                <p><span className="font-semibold text-gray-900">Business No:</span> 107-21-26475</p>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Contact</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">Address:</span><br/>1547-10 Sillim-dong, Gwanak-gu, Seoul</p>
                <p><span className="font-semibold text-gray-900">Email:</span><br/><a href="mailto:ggprgrkjh2@gmail.com" className="hover:text-blue-600 transition-colors">ggprgrkjh2@gmail.com</a></p>
                <p><span className="font-semibold text-gray-900">Phone:</span> +82-10-4549-2094</p>
              </div>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><Link href="/en/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></div>
                <div><Link href="/en/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Quick Links</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div><Link href="/en/pricing" className="hover:text-gray-900 transition-colors">Pricing</Link></div>
                <div><Link href="/en/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link></div>
                <div><a href="mailto:ggprgrkjh2@gmail.com" className="hover:text-gray-900 transition-colors">Contact</a></div>
              </div>
            </div>
          </div>

          {/* Logo and Copyright */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Link href="/en" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="VibeScan Logo"
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
