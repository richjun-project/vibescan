import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  metadataBase: new URL('https://vibescan.co.kr'),
  title: 'VibeScan - 웹 보안 점검 서비스',
  description: '개발자를 위한 자동화된 보안 취약점 스캔 및 AI 분석 서비스',
  keywords: ['웹 보안', '취약점 스캔', '보안 점검', 'OWASP', 'Nuclei', 'ZAP', '보안 진단'],
  authors: [{ name: 'silverithm' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'VibeScan - 웹 보안 점검 서비스',
    description: '개발자를 위한 자동화된 보안 취약점 스캔 및 AI 분석 서비스',
    url: 'https://vibescan.co.kr',
    siteName: 'VibeScan',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'VibeScan - 웹 보안 점검 서비스',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeScan - 웹 보안 점검 서비스',
    description: '개발자를 위한 자동화된 보안 취약점 스캔 및 AI 분석 서비스',
    images: [
      {
        url: '/logo.png',
        alt: 'VibeScan - 웹 보안 점검 서비스',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <script src="https://js.tosspayments.com/v2/standard" async></script>
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
