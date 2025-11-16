import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - VibeScan Security Guides',
  description: 'Practical guides and tutorials on web security, vulnerability scanning, and OWASP Top 10.',
  openGraph: {
    title: 'Blog - VibeScan Security Guides',
    description: 'Practical guides and tutorials on web security, vulnerability scanning, and OWASP Top 10.',
  }
}

const blogPosts = [
  {
    slug: "owasp-top-10-guide",
    title: "Complete Guide to OWASP Top 10 Vulnerabilities (2024)",
    description: "Learn about the top 10 most critical web application security risks and how to prevent them with detailed examples and best practices.",
    date: "2025-01-17",
    readTime: "15 min read",
    image: "/blog/owasp-top-10.png",
    tags: ["OWASP", "Web Security", "Vulnerabilities"]
  },
  {
    slug: "sql-injection-prevention",
    title: "SQL Injection Prevention: Developer's Complete Guide",
    description: "Learn what SQL Injection is, how it works, and comprehensive methods to prevent it in your Node.js applications with practical examples.",
    date: "2025-01-17",
    readTime: "12 min read",
    image: "/blog/sql-injection.png",
    tags: ["SQL Injection", "Database Security", "Node.js"]
  },
  {
    slug: "web-security-checklist",
    title: "Web Security Checklist for Modern Developers",
    description: "Essential security checklist to review before production deployment. Includes specific implementation methods and code examples for each item.",
    date: "2025-01-17",
    readTime: "18 min read",
    image: "/blog/security-checklist.png",
    tags: ["Web Security", "Checklist", "Developers"]
  }
]

export default function BlogPageEN() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
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
            <div className="flex items-center gap-6">
              <Link href="/en/blog" className="text-sm text-gray-900 hover:text-gray-600">
                Blog
              </Link>
              <Link href="/en/pricing" className="text-sm text-gray-900 hover:text-gray-600">
                Pricing
              </Link>
              <Link href="/en">
                <Button size="sm" variant="ghost">Home</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Security Blog
          </h1>
          <p className="text-xl text-gray-600">
            Practical guides and tutorials on web security, vulnerability scanning, and OWASP Top 10
          </p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/en/blog/${post.slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 border-gray-200 hover:border-gray-900">
                <div className="aspect-video bg-gray-100 border-b-2 border-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-900 text-xl font-bold px-6 text-center">
                    {post.title.substring(0, 35)}...
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
                    Read More
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
            Start Security Scanning with VibeScan Now
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Automatically scan 12,000+ vulnerability patterns in 5 minutes
          </p>
          <Link href="/en/register">
            <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-200">
              Get Started for Free
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
