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
    period: "month",
    scans: 1,
    description: "Free plan for personal projects",
    features: [
      "1 security scan per month",
      "Basic security score",
      "Preview available",
    ],
    icon: Shield,
    color: "from-gray-500 to-gray-600",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 9900,
    period: "month",
    scans: 5,
    description: "Starter plan for small projects",
    features: [
      "5 security scans per month",
      "Full vulnerability report",
      "PDF download",
      "AI-powered vulnerability analysis",
    ],
    icon: Sparkles,
    color: "from-green-500 to-green-600",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29900,
    period: "month",
    scans: 10,
    description: "Plan for developers and small teams",
    features: [
      "10 security scans per month",
      "Full vulnerability report",
      "PDF download",
      "AI-powered vulnerability analysis",
      "Priority support",
      "Unlimited scan history",
    ],
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 99900,
    period: "month",
    scans: 50,
    description: "Plan for enterprises and large projects",
    features: [
      "50 security scans per month",
      "Full vulnerability report",
      "PDF download",
      "AI-powered vulnerability analysis",
      "Real-time vulnerability monitoring",
      "Dedicated support",
    ],
    icon: Building2,
    color: "from-purple-500 to-purple-600",
    popular: false,
  },
]

export default function PricingPageEN() {
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

  const handleSubscribe = (planId: string) => {
    if (!isLoggedIn) {
      router.push(`/en/login?redirect=/en/pricing`)
      return
    }

    if (planId === "free") {
      // Check if user already has an active subscription (free or paid)
      if (subscription && subscription.status === 'active') {
        if (subscription.plan === 'free') {
          // Already on free plan
          toast.info("Already on the free plan", {
            description: "Start scanning from the dashboard!",
            action: {
              label: "Go to Dashboard",
              onClick: () => router.push("/en/dashboard")
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

          toast.error("Cannot switch to free plan", {
            description: `You are currently on the ${currentPlanName} plan. To switch to the free plan, please cancel your subscription from the dashboard.`,
            action: {
              label: "Go to Dashboard",
              onClick: () => router.push("/en/dashboard")
            }
          })
        }
        return
      }
      // No active subscription, redirect to dashboard (free plan will be auto-assigned)
      router.push("/en/dashboard")
      return
    }

    // Redirect to subscription checkout
    router.push(`/en/subscription/checkout?plan=${planId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    setUser(null)
    router.push("/en")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VibeScan
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  document.cookie = "user-lang-preference=ko; path=/; max-age=31536000"
                  window.location.href = "/pricing"
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                🇰🇷 한국어
              </button>
              {isLoggedIn ? (
                <>
                  <Link href="/en/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/en/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/en/register">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      Get Started
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
            Subscription Plans for Your Project
          </h1>
          <p className="text-xl text-gray-600">
            From free to enterprise, plans for every project size
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
                      Most Popular
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
                    {plan.scans} scans per month
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
                  {plan.id === "free" ? "Start Free" : "Subscribe"}
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
                  Custom solutions for large organizations. Unlimited scans, dedicated support, SLA guarantee
                </p>
              </div>
              <Button
                onClick={() => window.location.href = "mailto:ggprgrkjh2@gmail.com"}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Contact Us
              </Button>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I cancel my subscription at any time?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. After cancellation, you can continue using the service until your next billing date.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I change my plan mid-subscription?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time from the dashboard.
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
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Company Info</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">Company:</span> silverithm</p>
                <p><span className="font-semibold text-gray-900">CEO:</span> Jun-Hyeong Kim</p>
                <p><span className="font-semibold text-gray-900">Business Registration:</span> 107-21-26475</p>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Contact</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-900">Address:</span><br/>1547-10 Sillim-dong, Gwanak-gu, Seoul</p>
                <p><span className="font-semibold text-gray-900">Email:</span><br/><a href="mailto:ggprgrkjh2@gmail.com" className="hover:text-blue-600 transition-colors">ggprgrkjh2@gmail.com</a></p>
                <p><span className="font-semibold text-gray-900">Phone:</span> 010-4549-2094</p>
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
