"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function BillingAuthPageContentEN() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("Processing billing key authentication...")

  useEffect(() => {
    const authKey = searchParams.get("authKey")
    const customerKey = searchParams.get("customerKey")

    if (!authKey || !customerKey) {
      setStatus("error")
      setMessage("Invalid request")
      return
    }

    // Complete billing authentication
    completeBillingAuth(authKey, customerKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const completeBillingAuth = async (authKey: string, customerKey: string) => {
    try {
      // Get plan from sessionStorage
      const plan = sessionStorage.getItem('pendingSubscriptionPlan')

      if (!plan) {
        throw new Error('Subscription plan information not found')
      }

      const result = await apiClient.completeBillingAuth(authKey, customerKey, plan)

      // Clear plan from sessionStorage
      sessionStorage.removeItem('pendingSubscriptionPlan')

      setStatus("success")
      setMessage("Subscription started successfully!")

      // Update user data in localStorage
      const userData = await apiClient.getProfile()
      localStorage.setItem("user", JSON.stringify(userData))

      toast.success("Subscription started", {
        description: "You can now use premium features.",
      })

      // Redirect to success page
      setTimeout(() => {
        router.push("/en/subscription/success")
      }, 2000)
    } catch (error: any) {
      console.error("Billing auth error:", error)
      setStatus("error")
      setMessage(error.message || "Failed to process subscription")

      toast.error("Subscription start failed", {
        description: error.message || "Please try again later.",
      })
    }
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

      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card className="border border-gray-200">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              {status === "processing" && (
                <>
                  <div className="flex justify-center">
                    <Loader2 className="w-12 h-12 text-gray-900 animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
                  <p className="text-sm text-gray-600">Please wait...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{message}</h2>
                  <p className="text-sm text-gray-600">Redirecting to completion page...</p>
                </>
              )}

              {status === "error" && (
                <>
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <XCircle className="w-7 h-7 text-gray-900" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Subscription Processing Failed</h2>
                  <p className="text-sm text-gray-600">{message}</p>
                  <div className="flex gap-3 justify-center pt-4">
                    <Link href="/en/pricing">
                      <Button variant="outline" size="sm">
                        View Plans
                      </Button>
                    </Link>
                    <Link href="/en/dashboard">
                      <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
                        Dashboard
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function BillingAuthPageEN() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>}>
      <BillingAuthPageContentEN />
    </Suspense>
  )
}
