import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image: string
  content: string
  readTime: string
}

function getPost(slug: string): BlogPost | null {
  try {
    const filePath = path.join(process.cwd(), 'content', 'blog', 'ko', `${slug}.md`)
    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)

    // Calculate read time (assuming 200 words per minute)
    const wordCount = content.split(/\s+/g).length
    const readTime = Math.ceil(wordCount / 200)

    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
      author: data.author,
      tags: data.tags,
      image: data.image,
      content,
      readTime: `${readTime}분`
    }
  } catch (error) {
    return null
  }
}

function getAllPosts(): BlogPost[] {
  const postsDirectory = path.join(process.cwd(), 'content', 'blog', 'ko')
  const filenames = fs.readdirSync(postsDirectory)

  const posts = filenames
    .filter(filename => filename.endsWith('.md'))
    .map(filename => {
      const slug = filename.replace(/\.md$/, '')
      return getPost(slug)
    })
    .filter((post): post is BlogPost => post !== null)

  return posts
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)

  if (!post) {
    return {
      title: '페이지를 찾을 수 없습니다 - VibeScan',
    }
  }

  return {
    title: `${post.title} - VibeScan 블로그`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)

  if (!post) {
    notFound()
  }

  const allPosts = getAllPosts()
  const currentIndex = allPosts.findIndex(p => p.slug === slug)
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

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

      {/* Article */}
      <article className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-900">홈</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-900">블로그</Link>
          <span>/</span>
          <span className="text-gray-900">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <p className="text-xl text-gray-600">
            {post.description}
          </p>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
          prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 prose-pre:rounded-lg prose-pre:overflow-x-auto
          prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6
          prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6
          prose-li:text-gray-700 prose-li:mb-2
          prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
          prose-img:rounded-lg prose-img:shadow-lg"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Article Footer - Navigation */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="grid md:grid-cols-2 gap-6">
            {prevPost && (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="group p-6 border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>이전 글</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {prevPost.title}
                </h3>
              </Link>
            )}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group p-6 border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-md transition-all md:text-right"
              >
                <div className="flex items-center justify-end gap-2 text-sm text-gray-600 mb-2">
                  <span>다음 글</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {nextPost.title}
                </h3>
              </Link>
            )}
          </div>

          {/* Back to Blog List */}
          <div className="mt-12 text-center">
            <Link href="/blog">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                블로그 목록으로
              </Button>
            </Link>
          </div>
        </footer>
      </article>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            지금 VibeScan으로 보안 스캔을 시작하세요
          </h2>
          <p className="text-xl mb-8 opacity-90">
            12,000+ 취약점 패턴을 5분 안에 자동 검사
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              무료로 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
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
