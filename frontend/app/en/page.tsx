import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Shield, Zap, Award, ArrowRight, CheckCircle2, Sparkles, TrendingUp, Code, Lock, Rocket } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "VibeScan - Enterprise-Grade Security Analysis in 5 Minutes",
  description: "Detect 10,000+ vulnerability patterns and 500+ secret keys. AI-powered security analysis with instant fix guides. OWASP Top 10, dependency scanning, and secret detection.",
  keywords: ["security scanner", "vulnerability scanner", "OWASP Top 10", "dependency scanner", "secret detection", "security analysis", "penetration testing", "web security"],
  openGraph: {
    title: "VibeScan - Enterprise-Grade Security Analysis",
    description: "Complete security analysis in 5 minutes. 10,000+ vulnerability patterns, AI-powered fix guides.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["ko_KR"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeScan - Enterprise-Grade Security Analysis",
    description: "Complete security analysis in 5 minutes. 10,000+ vulnerability patterns.",
  },
  alternates: {
    canonical: "/en",
    languages: {
      "en": "/en",
      "ko": "/",
    },
  },
}

export default function HomeEN() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              VibeScan
            </div>
            <div className="flex items-center gap-6">
              <Link href="/en#pricing" className="text-gray-700 hover:text-gray-900 font-medium">
                Pricing
              </Link>
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                🇰🇷 한국어
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 group">
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Enterprise-Grade Security Verification
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-gray-900 via-blue-900 to-cyan-900 bg-clip-text text-transparent leading-[1.1] tracking-tight">
            Security Scanning,
            <br />
            Made Simple
          </h1>

          <p className="text-xl md:text-2xl text-gray-500 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
            10,000+ vulnerability patterns, 500+ secret key detection.
            <br className="hidden md:block" />
            Enterprise-grade security analysis completed in 5 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white h-16 px-10 text-lg font-bold shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 group rounded-xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/en#pricing">
              <Button variant="outline" className="h-16 px-10 text-lg font-bold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200">
                View Pricing
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-12 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span>Complete in 5 Minutes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span>10,000+ Vulnerability Patterns</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Powerful Security Analysis Engine
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light">
            Protect your production environment with enterprise-grade security verification
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <Card className="relative border-0 bg-white p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-4xl font-black text-gray-900 mb-2">10,000+</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Vulnerability Patterns
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6 font-light">
                Massive vulnerability database with real-time updates.
                Perfect detection from OWASP Top 10 to latest CVEs.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">SQL Injection</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">XSS</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">CSRF</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">SSL/TLS</span>
              </div>
            </div>
          </Card>

          <Card className="relative border-0 bg-white p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-4xl font-black text-gray-900 mb-2">All</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Dependency Security Analysis
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6 font-light">
                Supports all package managers including npm, pip, Maven.
                Instantly finds vulnerable libraries and suggests patch versions.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">npm</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">pip</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">Maven</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">Gradle</span>
              </div>
            </div>
          </Card>

          <Card className="relative border-0 bg-white p-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-2xl group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="text-4xl font-black text-gray-900 mb-2">500+</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Secret Key Exposure Detection
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6 font-light">
                500+ secret pattern recognition engine blocks cloud service keys
                like AWS, GCP, Stripe before they are exposed.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">AWS Keys</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">API Tokens</span>
                <span className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg font-semibold border border-gray-100">Private Keys</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Real-time Auto Updates</h4>
              <p className="text-gray-600 text-sm">
                Vulnerability rules are automatically updated daily to respond to the latest security threats.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">AI-Powered Priority Analysis</h4>
              <p className="text-gray-600 text-sm">
                AI guides you to prioritize fixes for vulnerabilities that actually impact your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-28 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              Simple and Clear Pricing
            </h2>
            <p className="text-xl text-gray-500 font-light">
              Start for free and purchase detailed reports only when you need them
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-6">
            {/* Free Plan */}
            <Card className="p-8 border-0 bg-gray-50 hover:bg-gray-100 transition-all flex flex-col rounded-2xl">
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-white rounded-xl mb-4 shadow-sm">
                  <Shield className="w-8 h-8 text-gray-900" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Free Trial</h3>
                <div className="mb-3">
                  <span className="text-5xl font-black text-gray-900">$0</span>
                </div>
                <p className="text-gray-500 font-medium text-sm">Basic Security Check</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">1 Free Scan</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">Vulnerability Count</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium text-sm">Security Score</span>
                </li>
              </ul>

              <Link href="/register" className="block mt-auto">
                <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold text-base rounded-xl hover:-translate-y-0.5 transition-all duration-200">
                  Start Free
                </Button>
              </Link>
            </Card>

            {/* Paid Plan */}
            <Card className="p-8 pt-10 border-0 bg-gradient-to-br from-blue-600 to-cyan-500 shadow-2xl relative flex flex-col rounded-2xl overflow-visible">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                  Recommended
                </span>
              </div>

              <div className="text-center mb-6 relative z-10">
                <div className="inline-block p-3 bg-white/20 backdrop-blur-sm rounded-xl mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Detailed Report</h3>
                <div className="mb-3">
                  <span className="text-5xl font-black text-white">$8.90</span>
                  <span className="text-white/80 text-base font-bold">/scan</span>
                </div>
                <p className="text-white/90 font-medium text-sm">AI Analysis + Fix Guide</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1 relative z-10">
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">All Free Features</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">Detailed Vulnerability Analysis</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">AI-Powered Fix Guide</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-bold text-white text-sm">PDF Download</span>
                </li>
              </ul>

              <div className="mt-auto relative z-10">
                <Link href="/pricing" className="block">
                  <Button className="w-full h-12 bg-white text-blue-600 hover:bg-gray-50 font-bold text-sm rounded-xl hover:-translate-y-0.5 transition-all duration-200 shadow-xl group">
                    Purchase
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>

                <p className="text-center text-xs text-white/90 font-semibold mt-3">
                  💡 Up to 20% off for 10+ purchases
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section - Simplified */}
      <section className="container mx-auto px-4 py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="group">
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">10,000+</div>
              <div className="text-gray-600 font-semibold text-lg">Vulnerability Patterns</div>
            </div>
            <div className="group">
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">500+</div>
              <div className="text-gray-600 font-semibold text-lg">Secret Key Detection</div>
            </div>
            <div className="group">
              <div className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">5 min</div>
              <div className="text-gray-600 font-semibold text-lg">Scan Completion</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              VibeScan
            </div>
            <div className="flex gap-8 text-sm font-medium text-gray-600">
              <Link href="/en#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
            <p className="text-sm text-gray-400 font-medium">© 2025 VibeScan</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
