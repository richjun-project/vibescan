import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VibeScan 요금제 - 웹 보안 스캔 가격 | 무료부터 기업용까지',
  description: '웹 보안 취약점 스캔 서비스 VibeScan의 요금제를 확인하세요. 무료 플랜부터 기업용까지, 월 ₩9,900원부터 시작하는 합리적인 가격으로 웹사이트 보안을 강화하세요.',
  keywords: [
    '웹 보안 가격',
    '취약점 스캔 비용',
    '보안 스캔 요금',
    'OWASP 스캔 가격',
    '웹 보안 서비스 가격',
    '취약점 진단 비용',
    'VibeScan 가격',
    '보안 점검 요금제',
    '웹 보안 구독',
    '보안 스캔 가격 비교'
  ],
  openGraph: {
    title: 'VibeScan 요금제 - 웹 보안 스캔 가격 비교',
    description: '무료 플랜부터 기업용까지. 월 ₩9,900원부터 시작하는 AI 기반 웹 보안 취약점 스캔 서비스',
    url: 'https://vibescan.co.kr/pricing',
    siteName: 'VibeScan',
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'VibeScan 요금제 - 4가지 플랜 비교',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeScan 요금제 - 웹 보안 스캔 가격',
    description: '무료 플랜부터 기업용까지. 월 ₩9,900원부터 시작하는 웹 보안 서비스',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://vibescan.co.kr/pricing',
    languages: {
      'ko': 'https://vibescan.co.kr/pricing',
      'en': 'https://vibescan.co.kr/en/pricing',
    },
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

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link rel="preconnect" href="https://js.tosspayments.com" />
      <link rel="dns-prefetch" href="https://js.tosspayments.com" />
      {children}
    </>
  )
}