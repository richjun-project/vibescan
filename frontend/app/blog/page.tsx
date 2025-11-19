import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '블로그 - VibeScan 보안 가이드',
  description: '웹 보안, 취약점 스캔, OWASP Top 10에 대한 실용적인 가이드와 튜토리얼을 제공합니다.',
  openGraph: {
    title: '블로그 - VibeScan 보안 가이드',
    description: '웹 보안, 취약점 스캔, OWASP Top 10에 대한 실용적인 가이드와 튜토리얼을 제공합니다.',
  }
}

import { getAllPosts } from "@/lib/blog"

export default function BlogPage() {
  const blogPosts = getAllPosts()
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
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
            <div className="flex items-center gap-6">
              <Link href="/blog" className="text-sm text-gray-900 hover:text-gray-600">
                블로그
              </Link>
              <Link href="/pricing" className="text-sm text-gray-900 hover:text-gray-600">
                요금제
              </Link>
              <Link href="/">
                <Button size="sm" variant="ghost">홈으로</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            보안 블로그
          </h1>
          <p className="text-xl text-gray-600">
            웹 보안, 취약점 스캔, OWASP Top 10에 대한 실용적인 가이드와 튜토리얼
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 border-gray-200 hover:border-gray-900">
                <div className="aspect-video bg-gray-100 border-b-2 border-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-900 text-xl font-bold px-6 text-center">
                    {post.title.substring(0, 25)}...
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-gray-900 font-semibold">
                    자세히 보기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="p-12 bg-gray-900 text-white text-center border-2 border-gray-800">
          <h2 className="text-3xl font-bold mb-4">
            지금 VibeScan으로 보안 스캔을 시작하세요
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            12,000+ 취약점 패턴을 5분 안에 자동 검사
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-200">
              무료로 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>© 2025 VibeScan by silverithm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
