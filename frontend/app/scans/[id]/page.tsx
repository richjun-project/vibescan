"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Shield,
  ArrowLeft,
  Clock,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  FileText,
  Sparkles,
  Zap,
  Loader2,
  Lock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import io from "socket.io-client"
import { PaymentModal } from "@/components/PaymentModal"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface Vulnerability {
  id: number
  title: string
  description: string
  severity: "critical" | "high" | "medium" | "low" | "info"
  category: string
  cveId?: string
  aiExplanation?: string
  fixGuide?: string
}

interface ScanDetail {
  id: number
  domain: string
  status: string
  progress?: number
  progressMessage?: string
  score?: number
  grade?: string
  createdAt: string
  completedAt?: string
  isPaid: boolean
  previewMode?: boolean
  vulnerabilities?: Vulnerability[]
  vulnerabilityCount?: number
  severityCounts?: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  message?: string
  aiSummary?: string
  results?: {
    aiSummary?: string
    [key: string]: any
  }
}

export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string
  const [scan, setScan] = useState<ScanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState<number>(0)
  const [progressMessage, setProgressMessage] = useState<string>("")
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [expandedVulns, setExpandedVulns] = useState<Set<number>>(new Set())
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  // Rotating motivational messages from homepage benefits
  const motivationalMessages = useMemo(() => [
    "12,000+ 취약점 패턴으로 완벽 탐지합니다",
    "실시간 웹 취약점을 정밀하게 스캐닝합니다",
    "500+ 시크릿 키 노출을 사전 차단합니다",
    "최신 보안 위협에 매일 자동 업데이트됩니다",
    "AI가 우선순위를 분석하여 가이드합니다",
  ], [])

  // Rotate messages every 4 seconds
  useEffect(() => {
    if (scan?.status === "running" || scan?.status === "pending") {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % motivationalMessages.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [scan?.status, motivationalMessages.length])

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      window.location.href = "/login"
      return
    }

    // Fetch user's subscription info
    const fetchSubscription = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/current`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setSubscriptionLoading(false)
      }
    }

    fetchSubscription()
    fetchScanDetail(token)

    // Connect to WebSocket for real-time progress
    // WebSocket uses root URL without /api prefix
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
    const wsUrl = backendUrl.replace(/\/api$/, "") // Remove /api suffix if present
    const socket = io(`${wsUrl}/scans`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    })

    let disconnectTimer: NodeJS.Timeout | null = null
    let connectionFailures = 0
    const MAX_FAILURES = 3

    socket.on("connect", () => {
      console.log("WebSocket connected")
      connectionFailures = 0 // Reset failure count on successful connection
      socket.emit("subscribe-scan", parseInt(scanId))
      // Clear disconnect timer on successful reconnection
      if (disconnectTimer) {
        clearTimeout(disconnectTimer)
        disconnectTimer = null
      }
    })

    socket.on("scan-progress", (data: any) => {
      if (data.scanId === parseInt(scanId)) {
        setProgress(data.progress)
        setProgressMessage(data.message)
      }
    })

    socket.on("scan-completed", (data: any) => {
      if (data.scanId === parseInt(scanId)) {
        setProgress(100)
        setProgressMessage("Scan completed")
        setTimeout(() => {
          fetchScanDetail(token)
        }, 2000)
      }
    })

    socket.on("scan-failed", (data: any) => {
      if (data.scanId === parseInt(scanId)) {
        setProgressMessage(`Scan failed: ${data.error}`)
        toast.error("스캔 실패", {
          description: data.error,
        })
        // Redirect to dashboard after showing error
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      }
    })

    socket.on("disconnect", (reason: string) => {
      console.warn("WebSocket disconnected:", reason)

      // io client disconnect는 정상 종료이므로 무시
      if (reason === "io client disconnect") return

      // 서버 측 disconnect는 즉시 처리
      if (!disconnectTimer) {
        disconnectTimer = setTimeout(() => {
          toast.error("서버 연결이 끊겼습니다", {
            description: "대시보드로 이동합니다.",
          })
          router.push("/dashboard")
        }, 5000) // 5초로 단축
      }
    })

    socket.on("connect_error", (error: Error) => {
      console.error("WebSocket connection error:", error)
      connectionFailures++

      // 연속 3회 실패 시 즉시 리다이렉트
      if (connectionFailures >= MAX_FAILURES) {
        toast.error("서버에 연결할 수 없습니다", {
          description: "대시보드로 이동합니다.",
        })
        setTimeout(() => router.push("/dashboard"), 2000)
      }
    })

    socket.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed")
      toast.error("서버 재연결에 실패했습니다", {
        description: "대시보드로 이동합니다.",
      })
      setTimeout(() => router.push("/dashboard"), 2000)
    })

    return () => {
      if (disconnectTimer) {
        clearTimeout(disconnectTimer)
      }
      socket.emit("unsubscribe-scan", parseInt(scanId))
      socket.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId])

  const fetchScanDetail = async (token: string) => {
    try {
      const data = await apiClient.getScan(parseInt(scanId)) as ScanDetail
      setScan(data)

      // Set initial progress from database if scan is running
      if (data.status === 'running' && data.progress !== undefined) {
        setProgress(data.progress)
        if (data.progressMessage) {
          setProgressMessage(data.progressMessage)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleVulnerability = (id: number) => {
    setExpandedVulns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleDownloadPdf = async () => {
    try {
      toast.info("PDF 다운로드 중...")
      await apiClient.downloadPdf(parseInt(scanId))
      toast.success("PDF 다운로드 완료!")
    } catch (error: any) {
      toast.error(error.message || "PDF 다운로드 실패")
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-300 gap-1.5">
            <XCircle className="w-3 h-3" />
            Critical
          </Badge>
        )
      case "high":
        return (
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border border-orange-300 gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border border-yellow-300 gap-1.5">
            <Info className="w-3 h-3" />
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300 gap-1.5">
            <Info className="w-3 h-3" />
            Low
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-300 gap-1.5">
            <Info className="w-3 h-3" />
            Info
          </Badge>
        )
    }
  }

  const getGradeColor = (grade?: string) => {
    switch (grade) {
      case "A":
        return "text-green-600"
      case "B":
        return "text-blue-600"
      case "C":
        return "text-yellow-600"
      case "D":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border border-green-300">완료</Badge>
      case "running":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300">실행 중</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border border-yellow-300">대기 중</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-300">실패</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border border-gray-300">{status}</Badge>
    }
  }

  const getSeverityStats = () => {
    if (scan?.severityCounts) {
      return scan.severityCounts
    }

    if (!scan?.vulnerabilities) {
      return { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    }

    return scan.vulnerabilities.reduce(
      (acc, vuln) => {
        acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
        return acc
      },
      { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<string, number>
    )
  }

  // Get actual vulnerabilities from backend for preview (first 3)
  const getSampleVulnerabilities = () => {
    if (!scan?.vulnerabilities || scan.vulnerabilities.length === 0) {
      return []
    }

    // Return first 3 actual vulnerabilities from scan results
    return scan.vulnerabilities.slice(0, 3).map(vuln => ({
      title: vuln.title,
      category: vuln.category,
      description: vuln.description,
      severity: vuln.severity,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Skeleton */}
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-6xl">
          {/* Hero Skeleton */}
          <div className="mb-12">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="flex items-center gap-8">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-14 w-40" />
              </div>
              <div className="flex items-center gap-6 ml-auto">
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-12 w-16" />
              </div>
            </div>
          </div>

          {/* Vulnerabilities Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            스캔을 찾을 수 없습니다
          </h2>
          <p className="text-gray-500 mb-8">
            {error || "존재하지 않는 스캔이거나 접근 권한이 없습니다"}
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-full border-2 border-gray-300 hover:border-blue-300 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stats = getSeverityStats()
  const vulnCount = scan.vulnerabilityCount || scan.vulnerabilities?.length || 0

  // Show progress for running scans
  if (scan.status === "running" || scan.status === "pending") {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="rounded-full text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold text-gray-900 mb-3">
              스캔 진행 중
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              {scan.domain}
            </p>
            <div className="w-24 h-24 mx-auto my-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-blue-200 flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-blue-600 animate-subtle-pulse" />
            </div>
            <p
              key={currentMessageIndex}
              className="text-sm text-gray-600 font-medium animate-text-fade"
            >
              {motivationalMessages[currentMessageIndex]}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              일반적으로 5-10분 소요됩니다
            </p>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-8 p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-semibold text-gray-900">
                {progressMessage || "스캔을 시작하는 중..."}
              </span>
              <span className="text-2xl font-bold text-blue-600">{progress}%</span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className={cn(
                  "h-full transition-all duration-700 ease-out rounded-full relative",
                  progress === 0
                    ? "bg-gradient-to-r from-gray-400 to-gray-500"
                    : progress < 30
                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                    : progress < 70
                    ? "bg-gradient-to-r from-purple-500 to-purple-600"
                    : "bg-gradient-to-r from-green-500 to-emerald-600"
                )}
                style={{
                  width: `${Math.max(progress, 3)}%`,
                  backgroundSize: '200% 100%',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                     style={{ backgroundSize: '200% 100%' }} />
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mt-8 grid grid-cols-4 gap-4">
              <div className={cn(
                "text-center transition-all",
                progress >= 5 ? 'opacity-100' : 'opacity-40'
              )}>
                <div className="relative inline-block">
                  {progress >= 0 && progress < 5 && (
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-blue-400 animate-ring-pulse" />
                  )}
                  <div className={cn(
                    "w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all shadow-sm",
                    progress >= 5
                      ? 'bg-blue-600 scale-110'
                      : 'bg-gray-300'
                  )}>
                    {progress >= 5 ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">1</span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium block",
                  progress >= 5 ? 'text-blue-600' : 'text-gray-400'
                )}>초기화</span>
              </div>
              <div className={cn(
                "text-center transition-all",
                progress >= 40 ? 'opacity-100' : 'opacity-40'
              )}>
                <div className="relative inline-block">
                  {progress >= 5 && progress < 40 && (
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-purple-400 animate-ring-pulse" />
                  )}
                  <div className={cn(
                    "w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all shadow-sm",
                    progress >= 40
                      ? 'bg-purple-600 scale-110'
                      : 'bg-gray-300'
                  )}>
                    {progress >= 40 ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">2</span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium block",
                  progress >= 40 ? 'text-purple-600' : 'text-gray-400'
                )}>기본 스캔</span>
              </div>
              <div className={cn(
                "text-center transition-all",
                progress >= 90 ? 'opacity-100' : 'opacity-40'
              )}>
                <div className="relative inline-block">
                  {progress >= 40 && progress < 90 && (
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-indigo-400 animate-ring-pulse" />
                  )}
                  <div className={cn(
                    "w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all shadow-sm",
                    progress >= 90
                      ? 'bg-indigo-600 scale-110'
                      : 'bg-gray-300'
                  )}>
                    {progress >= 90 ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">3</span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium block",
                  progress >= 90 ? 'text-indigo-600' : 'text-gray-400'
                )}>고급 스캔</span>
              </div>
              <div className={cn(
                "text-center transition-all",
                progress >= 100 ? 'opacity-100' : 'opacity-40'
              )}>
                <div className="relative inline-block">
                  {progress >= 90 && progress < 100 && (
                    <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-green-400 animate-ring-pulse" />
                  )}
                  <div className={cn(
                    "w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center transition-all shadow-sm",
                    progress >= 100
                      ? 'bg-green-600 scale-110'
                      : 'bg-gray-300'
                  )}>
                    {progress >= 100 ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-bold text-white">4</span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-medium block",
                  progress >= 100 ? 'text-green-600' : 'text-gray-400'
                )}>완료</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">시작 시간</p>
                  <p className="text-gray-500">{new Date(scan.createdAt).toLocaleString("ko-KR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">상태</p>
                  <div className="mt-1">{getStatusBadge(scan.status)}</div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            스캔 완료 시 자동으로 결과가 표시됩니다
          </p>
        </div>
      </div>
    )
  }

  // Check if user has active paid subscription
  const hasPaidSubscription = subscription && subscription.status === 'active' && subscription.plan !== 'free'

  // Free preview mode - Show only summary if no paid subscription
  // TEMP: Disabled for free access - change 'false &&' to enable paywall again
  if (false && !hasPaidSubscription && (scan.previewMode || !scan.isPaid)) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="rounded-full text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-6xl">
          {/* Clean Hero Section */}
          <div className="mb-12">
            <div className="flex items-baseline gap-3 mb-4">
              <h1 className="text-4xl font-semibold text-gray-900">{scan.domain}</h1>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-300">
                무료 미리보기
              </Badge>
            </div>

            <div className="flex items-center gap-8 mt-8">
              {/* Main Score Display */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">보안 점수</div>
                {scan.score !== undefined ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-bold text-gray-900">{scan.score}</span>
                    <span className="text-2xl text-gray-400">/100</span>
                    {scan.grade && (
                      <span className={cn(
                        "text-3xl font-semibold ml-4",
                        getGradeColor(scan.grade)
                      )}>
                        {scan.grade}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-2xl text-gray-400">분석 중...</div>
                )}
              </div>

              {/* Severity Breakdown */}
              <div className="flex items-center gap-6 ml-auto">
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 mb-2">Critical</div>
                  <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 mb-2">High</div>
                  <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 mb-2">Medium</div>
                  <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-gray-500 mb-2">Low</div>
                  <div className="text-3xl font-bold text-blue-600">{stats.low}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(scan.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
              <span>•</span>
              <span className="font-medium">{vulnCount}개 취약점 발견</span>
            </div>
          </div>

          {/* Sample Vulnerabilities Preview - Clean */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-gray-900">취약점 미리보기</h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  총 {vulnCount}개
                </span>
              </div>
            </div>

            {/* Sample items */}
            <div className="space-y-3 mb-8">
              {getSampleVulnerabilities().map((sample, idx) => (
                <div
                  key={idx}
                  className="border-2 border-gray-200 rounded-2xl p-6 bg-white hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{sample.title}</h3>
                      {getSeverityBadge(sample.severity)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">{sample.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {sample.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Blurred locked items with full info */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm rounded-2xl">
                <div className="text-center px-8 py-10 bg-white rounded-3xl border-2 border-gray-200 shadow-xl max-w-xl">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {Math.max(0, vulnCount - 3)}개 추가 취약점 잠금
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    상세한 취약점 정보, CVE ID, AI 분석 및 단계별 수정 가이드를 확인하세요
                  </p>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-gray-900 block">CVE ID</span>
                      <span className="text-xs text-gray-600">CVSS 점수</span>
                    </div>
                    <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <Sparkles className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-gray-900 block">AI 분석</span>
                      <span className="text-xs text-gray-600">상세 설명</span>
                    </div>
                    <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                      <FileText className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                      <span className="text-xs font-semibold text-gray-900 block">수정 방법</span>
                      <span className="text-xs text-gray-600">단계별 가이드</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => router.push('/pricing')}
                    size="lg"
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    구독하고 전체 리포트 보기
                  </Button>
                </div>
              </div>

              {/* Blurred placeholder items */}
              <div className="space-y-3 opacity-20 pointer-events-none select-none">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-2 border-gray-200 rounded-2xl p-6 bg-white">
                    <div className="h-6 bg-gray-300 rounded-lg w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Modal */}
          <PaymentModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            scanId={parseInt(scanId)}
            vulnerabilityCount={vulnCount}
            onSuccess={() => {
              setPaymentModalOpen(false)
              toast.success("결제 완료! 페이지를 새로고침합니다.")
              window.location.reload()
            }}
          />
        </div>
      </div>
    )
  }

  // Paid scan - Show full details
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-full text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Clean Hero Section - Domain & Score */}
        <div className="mb-12">
          <div className="flex items-baseline gap-3 mb-4">
            <h1 className="text-4xl font-semibold text-gray-900">{scan.domain}</h1>
            {getStatusBadge(scan.status)}
          </div>

          <div className="flex items-center gap-8 mt-8">
            {/* Main Score Display */}
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">보안 점수</div>
              {scan.score !== undefined ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold text-gray-900">{scan.score}</span>
                  <span className="text-2xl text-gray-400">/100</span>
                  {scan.grade && (
                    <span className={cn(
                      "text-3xl font-semibold ml-4",
                      getGradeColor(scan.grade)
                    )}>
                      {scan.grade}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-2xl text-gray-400">분석 중...</div>
              )}
            </div>

            {/* Severity Breakdown - Inline */}
            <div className="flex items-center gap-6 ml-auto">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">Critical</div>
                <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">High</div>
                <div className="text-3xl font-bold text-orange-600">{stats.high}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">Medium</div>
                <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 mb-2">Low</div>
                <div className="text-3xl font-bold text-blue-600">{stats.low}</div>
              </div>
            </div>
          </div>

          {/* Scan metadata - subtle */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(scan.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
              <span>•</span>
              <span className="font-medium">{vulnCount}개 취약점 발견</span>
              <span>•</span>
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                전체 리포트
              </span>
            </div>

            {/* PDF Download Button */}
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF 다운로드
            </Button>
          </div>
        </div>

        {/* Two Column Layout: Vulnerabilities (left) + AI Analysis (right) */}
        <div className={cn(
          "grid grid-cols-1 gap-8",
          (scan.aiSummary || scan.results?.aiSummary) ? 'lg:grid-cols-3' : ''
        )}>
          {/* Left Column: Vulnerabilities List (2/3 width if AI exists, full width otherwise) */}
          <div className={(scan.aiSummary || scan.results?.aiSummary) ? 'lg:col-span-2' : ''}>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">취약점 목록</h2>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              {vulnCount}개 발견
            </span>
          </div>

          {!scan.vulnerabilities || scan.vulnerabilities.length === 0 ? (
            scan.status === 'failed' ? (
              <div className="text-center py-20 p-8 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-dashed border-red-300 rounded-2xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-2">
                  스캔이 실패했습니다
                </div>
                <div className="text-gray-600">
                  스캔 중 오류가 발생했습니다. 다시 시도해주세요.
                </div>
              </div>
            ) : (
              <div className="text-center py-20 p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-2xl">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-2">
                  취약점이 발견되지 않았습니다
                </div>
                <div className="text-gray-600">
                  사이트가 안전한 것으로 보입니다
                </div>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {scan.vulnerabilities.map((vuln) => {
                const isExpanded = expandedVulns.has(vuln.id)
                return (
                  <div
                    key={vuln.id}
                    className={cn(
                      "border-2 rounded-2xl overflow-hidden transition-all",
                      isExpanded
                        ? "border-blue-300 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                  >
                    {/* Vulnerability Header - Clickable */}
                    <button
                      onClick={() => toggleVulnerability(vuln.id)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {vuln.title}
                            </h3>
                            {getSeverityBadge(vuln.severity)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">{vuln.category}</span>
                            {vuln.cveId && (
                              <>
                                <span>•</span>
                                <span className="font-mono font-semibold text-gray-700">{vuln.cveId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                      )}
                    </button>

                    {/* Vulnerability Details - Expandable */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 space-y-6 border-t-2 border-gray-100 bg-gray-50">
                        {/* Description */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            설명
                          </h4>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {vuln.description}
                          </p>
                        </div>

                        {/* AI Explanation */}
                        {vuln.aiExplanation && (
                          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                            <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              AI 분석
                            </h4>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {vuln.aiExplanation}
                            </p>
                          </div>
                        )}

                        {/* Fix Guide */}
                        {vuln.fixGuide && (
                          <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                            <h4 className="text-xs font-semibold text-green-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              수정 가이드
                            </h4>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {vuln.fixGuide}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          </div>

          {/* Right Column: AI Analysis (1/3 width, sticky) */}
          {(scan.aiSummary || scan.results?.aiSummary) && (
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">AI 보안 분석</h3>
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
                    {scan.aiSummary || scan.results?.aiSummary}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
