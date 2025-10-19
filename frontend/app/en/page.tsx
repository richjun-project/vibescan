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

export default function HomeEN() {
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
      router.push("/en/register")
      return
    }

    // Check if user already has an active subscription (free or paid)
    if (subscription && subscription.status === 'active') {
      if (subscription.plan === 'free') {
        // Already on free plan
        toast.info("Already on Free Plan", {
          description: "Start scanning from your dashboard!",
          action: {
            label: "Go to Dashboard",
            onClick: () => router.push("/en/dashboard")
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

        toast.error("Cannot Switch to Free Plan", {
          description: `You are currently on the ${currentPlanName} plan. To switch to the free plan, please cancel your subscription from the dashboard.`,
          action: {
            label: "Go to Dashboard",
            onClick: () => router.push("/en/dashboard")
          }
        })
      }
      return
    }

    // No active subscription, redirect to dashboard
    router.push("/en/dashboard")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Apple Style with Mobile Nav */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 min-h-[56px]">
          <nav className="flex items-center justify-between">
            <Link href="/en" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="VibeScan Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-gray-900">VibeScan</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/en/pricing" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
                Pricing
              </Link>
              <button
                onClick={() => {
                  document.cookie = "user-lang-preference=ko; path=/; max-age=31536000"
                  window.location.href = "/"
                }}
                className="text-sm text-gray-900 hover:text-gray-600 transition-colors"
              >
                🇰🇷 한국어
              </button>
              {isLoggedIn ? (
                <Link href="/en/dashboard">
                  <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/en/login" className="text-sm text-gray-900 hover:text-gray-600 transition-colors">
                    Sign In
                  </Link>
                  <Link href="/en/register">
                    <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" aria-label="Open menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-6">
                  <Link
                    href="/en/pricing"
                    className="text-base text-gray-900 hover:text-gray-600 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg"
                  >
                    Pricing
                  </Link>
                  <button
                    onClick={() => {
                      document.cookie = "user-lang-preference=ko; path=/; max-age=31536000"
                      window.location.href = "/"
                    }}
                    className="text-base text-gray-900 hover:text-gray-600 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg text-left"
                  >
                    🇰🇷 한국어
                  </button>
                  {isLoggedIn ? (
                    <Link href="/en/dashboard" className="mt-2">
                      <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/en/login"
                        className="text-base text-gray-900 hover:text-gray-600 transition-colors py-2 px-4 hover:bg-gray-100 rounded-lg"
                      >
                        Sign In
                      </Link>
                      <Link href="/en/register" className="mt-2">
                        <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                          Get Started
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
              Web Security Scanning,<br />Made Simple
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Protect your production environment in 5 minutes<br className="hidden md:block" />
              with 12,000+ vulnerability patterns and AI analysis
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href={isLoggedIn ? "/en/dashboard" : "/en/register"}>
                <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg">
                  {isLoggedIn ? "Go to Dashboard" : "Start Free"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Enterprise-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Complete in 5 Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>12,000+ Vulnerability Patterns</span>
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
              Powerful Security Analysis Engine
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Protect your production environment with enterprise-grade security verification
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 bg-gray-50 border-0 hover:bg-gray-100 transition-all duration-150">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  12,000+ Vulnerability Patterns
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Daily-updated massive vulnerability database detects OWASP Top 10, latest CVEs, and Zero-Day vulnerabilities.
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
                  Real-time Web Vulnerability Scanning
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Industry-leading scanners like Nuclei and ZAP detect web application security vulnerabilities in real-time.
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
                  500+ Secret Key Exposure Detection
                </h3>
                <p className="text-gray-500 leading-relaxed mb-4">
                  500+ secret pattern recognition detects all cloud service keys like AWS, GCP, Azure, and Stripe to prevent leaks.
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
              Real-time Auto Updates
            </h3>
            <p className="text-gray-500 leading-relaxed">
              Vulnerability rules are automatically updated daily to respond to the latest security threats.
              New CVEs can be detected within 24 hours of registration.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              AI-Powered Priority Analysis
            </h3>
            <p className="text-gray-500 leading-relaxed">
              AI guides you to prioritize fixes for vulnerabilities that actually impact your business.
              Provides copy-paste ready code for immediate implementation.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section - Apple Style */}
      <section className="container mx-auto px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-500">
              Start for free and upgrade as you need
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
                  <span className="text-2xl font-semibold text-gray-900">$0</span>
                  <span className="text-gray-500 text-xs font-medium">/month</span>
                </div>
                <p className="text-xs text-gray-500">For Personal Projects</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900">1 Scan per Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900">Report Preview</span>
                </li>
              </ul>

              <Button
                onClick={handleFreePlanClick}
                variant="secondary"
                className="w-full rounded-full text-sm"
              >
                Start Free
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
                  <span className="text-2xl font-semibold text-gray-900">$8</span>
                  <span className="text-gray-500 text-xs font-medium">/month</span>
                </div>
                <p className="text-xs text-gray-500">For Small Projects</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">5 Scans per Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">Full Reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">AI Analysis</span>
                </li>
              </ul>

              <Link href="/en/pricing">
                <Button variant="secondary" className="w-full rounded-full text-sm">
                  Subscribe
                </Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="p-6 border-2 border-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-150 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  Popular
                </span>
              </div>

              <div className="mb-5">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Pro</h3>
                <div className="mb-1">
                  <span className="text-2xl font-semibold text-gray-900">$24</span>
                  <span className="text-gray-500 text-xs font-medium">/month</span>
                </div>
                <p className="text-xs text-gray-500">For Developers & Teams</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">10 Scans per Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">Full Reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">AI Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900 font-medium">Priority Support</span>
                </li>
              </ul>

              <Link href="/en/pricing">
                <Button className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm">
                  Subscribe
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
                  <span className="text-2xl font-semibold text-gray-900">$79</span>
                  <span className="text-gray-500 text-xs font-medium">/month</span>
                </div>
                <p className="text-xs text-gray-500">For Enterprises</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">50 Scans per Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">Full Reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">AI Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-900">Dedicated Support</span>
                </li>
              </ul>

              <Link href="/en/pricing">
                <Button variant="secondary" className="w-full rounded-full text-sm">
                  Subscribe
                </Button>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/en/pricing" className="text-blue-600 hover:text-blue-700 font-semibold">
              Compare All Plans →
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
              <div className="text-gray-500">Vulnerability Patterns</div>
            </div>
            <div>
              <div className="text-6xl font-semibold text-gray-900 mb-2">
                500+
              </div>
              <div className="text-gray-500">Secret Key Detection</div>
            </div>
            <div>
              <div className="text-6xl font-semibold text-gray-900 mb-2">
                5 min
              </div>
              <div className="text-gray-500">Scan Completion</div>
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
