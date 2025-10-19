import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center px-6">
            <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">페이지를 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
                  <Home className="w-4 h-4 mr-2" />
                  홈으로 돌아가기
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  대시보드
                </Button>
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                도움이 필요하신가요?{' '}
                <a href="mailto:ggprgrkjh2@gmail.com" className="text-blue-600 hover:underline">
                  문의하기
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}