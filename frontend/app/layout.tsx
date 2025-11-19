import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { AnalyticsProvider } from '@/components/analytics-provider'
import { OrganizationSchema, WebSiteSchema, SoftwareApplicationSchema } from './schema'
import { WebVitals } from './web-vitals'

export const metadata: Metadata = {
  metadataBase: new URL('https://vibescan.co.kr'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  title: 'VibeScan - 웹 보안 점검 서비스',
  description: 'VibeScan은 Nuclei와 ZAP 기반으로 12,000+ 취약점 패턴을 실시간 탐지합니다. OWASP Top 10, CVE, Zero-Day 취약점을 5분 안에 분석하고 AI가 해결책을 제시합니다.',
  keywords: ['웹 보안', '취약점 스캔', '보안 점검', 'OWASP', 'Nuclei', 'ZAP', '보안 진단', '웹 취약점 스캔 도구', '자동화 보안 점검 서비스', 'OWASP 취약점 탐지', '개발자 보안 솔루션'],
  authors: [{ name: 'silverithm' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  alternates: {
    canonical: 'https://vibescan.co.kr/',
    languages: {
      'ko-KR': 'https://vibescan.co.kr/',
      'en-US': 'https://vibescan.co.kr/en',
      'x-default': 'https://vibescan.co.kr/',
    },
  },
  openGraph: {
    title: 'VibeScan - 웹 보안 점검 서비스',
    description: 'VibeScan은 Nuclei와 ZAP 기반으로 12,000+ 취약점 패턴을 실시간 탐지합니다. OWASP Top 10, CVE, Zero-Day 취약점을 5분 안에 분석하고 AI가 해결책을 제시합니다.',
    url: 'https://vibescan.co.kr',
    siteName: 'VibeScan',
    images: [
      {
        url: '/logo2.png',
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
    description: 'VibeScan은 Nuclei와 ZAP 기반으로 12,000+ 취약점 패턴을 실시간 탐지합니다.',
    images: [
      {
        url: '/logo2.png',
        alt: 'VibeScan - 웹 보안 점검 서비스',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <link rel="preconnect" href="https://js.tosspayments.com" />
        <link rel="dns-prefetch" href="https://js.tosspayments.com" />
        <script src="https://js.tosspayments.com/v2/standard" async></script>
        <OrganizationSchema />
        <WebSiteSchema />
        <SoftwareApplicationSchema />
      </head>
      <body>
        <WebVitals />
        <AnalyticsProvider>
          {children}
        </AnalyticsProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
