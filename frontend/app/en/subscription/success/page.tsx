"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export default function SubscriptionSuccessPageEN() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/en/login")
      return
    }

    fetchSubscription()
  }, [router])

  const fetchSubscription = async () => {
    try {
      const data = await apiClient.getSubscription()
      setSubscription(data)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      free: "Free",
      pro: "Pro",
      business: "Business",
      enterprise: "Enterprise",
    }
    return names[plan?.toLowerCase()] || plan
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Subscription Started
          </h1>
          <p className="text-gray-600">
            You can now use all features of the {getPlanName(subscription?.plan)} plan
          </p>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <Card className="mb-8 border border-gray-200">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">
                    {getPlanName(subscription.plan)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Payment amount</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.amount > 0
                      ? `₩${subscription.amount.toLocaleString()}/month`
                      : "Free"
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Monthly scans</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.monthlyScansLimit}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-gray-600">Next billing date</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.nextBillingDate
                      ? new Date(subscription.nextBillingDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Button */}
        <div className="flex justify-center">
          <Link href="/en/dashboard" className="w-full">
            <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium">
              Go to Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Have questions?{" "}
            <a
              href="mailto:ggprgrkjh2@gmail.com"
              className="text-gray-900 hover:underline font-medium"
            >
              ggprgrkjh2@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
