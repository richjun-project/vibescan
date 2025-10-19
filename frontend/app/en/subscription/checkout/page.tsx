"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Check, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { loadTossPayments } from "@tosspayments/tosspayments-sdk"

const PLAN_INFO: Record<string, {
  name: string;
  price: number;
  scans: number;
  features: string[];
}> = {
  starter: {
    name: "Starter",
    price: 9900,
    scans: 5,
    features: [
      "5 security scans per month",
      "Full vulnerability report",
      "PDF download",
      "AI-powered vulnerability analysis",
    ],
  },
  pro: {
    name: "Pro",
    price: 29900,
    scans: 10,
    features: [
      "10 security scans per month",
      "Full vulnerability report",
      "PDF download",
      "AI-powered vulnerability analysis",
      "Priority support",
      "Unlimited scan history",
    ],
  },
  business: {
    name: "Business",
    price: 99900,
    scans: 50,
    features: [
      "50 security scans per month",
      "Full vulnerability report",
      "PDF download",
      "AI-powered vulnerability analysis",
      "Real-time vulnerability monitoring",
      "Dedicated support",
    ],
  },
}

function SubscriptionCheckoutPageContentEN() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") as "starter" | "pro" | "business" | null
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/en/login?redirect=/en/pricing")
      return
    }

    // Validate plan
    if (!plan || !PLAN_INFO[plan]) {
      toast.error("Invalid plan")
      router.push("/en/pricing")
      return
    }

    // Get user info
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Check for billing auth failure
    const error = searchParams.get("error")
    const errorCode = searchParams.get("code")
    const errorMessage = searchParams.get("message")

    if (error === "billing_auth_failed") {
      // Display error to user
      toast.error("Card registration failed", {
        description: errorMessage ? decodeURIComponent(errorMessage) : "Please check your card information.",
      })

      // Clear error parameters from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      newUrl.searchParams.delete("code")
      newUrl.searchParams.delete("message")
      router.replace(newUrl.pathname + newUrl.search)
    }
  }, [plan, router, searchParams])

  const handleSubscribe = async () => {
    if (!plan) return

    setLoading(true)
    try {
      // Get customerKey from backend (do not change subscription info!)
      const result = await apiClient.initiateSubscription(plan)

      if (!result.customerKey) {
        toast.error("Failed to start subscription")
        setLoading(false)
        return
      }

      // Store plan in sessionStorage to pass it after billing auth
      sessionStorage.setItem('pendingSubscriptionPlan', plan)

      // Load TossPayments V2 SDK
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_XZYkKL4MrjjoNwWzKWERr0zJwlEW"
      const tossPayments = await loadTossPayments(clientKey)

      // Create payment instance with customerKey
      const payment = tossPayments.payment({
        customerKey: result.customerKey,
      })

      // Request billing authentication
      await payment.requestBillingAuth({
        method: "CARD", // Automatic payment (billing) supports cards only
        successUrl: `${window.location.origin}/en/subscription/billing-auth`,
        failUrl: `${window.location.origin}/en/subscription/checkout?plan=${plan}&error=billing_auth_failed`,
        customerEmail: user?.email || "",
        customerName: user?.name || user?.email || "Customer",
      })
    } catch (error: any) {
      console.error("[SUBSCRIPTION] Error:", error)
      toast.error("Subscription processing failed", {
        description: error.message || "Please try again later.",
      })
      setLoading(false)
    }
  }

  if (!plan || !PLAN_INFO[plan]) {
    return null
  }

  const planInfo = PLAN_INFO[plan]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/en" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="VibeScan Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-gray-900">
                VibeScan
              </h1>
            </Link>
            <Link href="/en/pricing">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Plans
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Payment</h1>
          <p className="text-gray-600">
            Start your subscription with the selected plan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {planInfo.name} Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ₩{planInfo.price.toLocaleString()}
                  <span className="text-base font-normal text-gray-600">/month</span>
                </div>
                <div className="text-sm text-gray-600">{planInfo.scans} scans per month</div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Included features</p>
                {planInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <div className="space-y-6">
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900">{planInfo.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Billing cycle</span>
                  <span className="font-medium text-gray-900">Monthly</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">First payment</span>
                  <span className="font-medium text-gray-900">Immediately</span>
                </div>
                <div className="flex justify-between py-4">
                  <span className="font-semibold text-gray-900">Total amount</span>
                  <span className="font-bold text-gray-900">
                    ₩{planInfo.price.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-gray-50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-xs text-gray-600">
                  <p>• Automatically charged monthly</p>
                  <p>• Cancel your subscription at any time</p>
                  <p>• Service available until next billing date after cancellation</p>
                  <p>• Refunds processed according to subscription policy</p>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Start Subscription</>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500">
              By clicking the Start Subscription button, you agree to our{" "}
              <Link href="/en/terms" className="underline hover:text-gray-900">
                Terms of Service
              </Link>
              {" "}and{" "}
              <Link href="/en/privacy" className="underline hover:text-gray-900">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionCheckoutPageEN() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <SubscriptionCheckoutPageContentEN />
    </Suspense>
  )
}
