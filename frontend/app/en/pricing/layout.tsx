import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VibeScan Pricing - Web Security Scanner Pricing Plans',
  description: 'Compare VibeScan web security vulnerability scanner pricing. From free to enterprise plans starting at ₩9,900/month. AI-powered security scanning for every project size.',
  keywords: [
    'web security pricing',
    'vulnerability scanner pricing',
    'security scan cost',
    'OWASP scanner price',
    'web security service pricing',
    'vulnerability assessment cost',
    'VibeScan pricing',
    'security scan subscription',
    'web security plans',
    'security scanner comparison'
  ],
  openGraph: {
    title: 'VibeScan Pricing - Web Security Scanner Plans',
    description: 'From free to enterprise. AI-powered web security vulnerability scanning starting at ₩9,900/month',
    url: 'https://vibescan.co.kr/en/pricing',
    siteName: 'VibeScan',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'VibeScan Pricing - Compare 4 Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeScan Pricing - Web Security Scanner',
    description: 'From free to enterprise. Web security vulnerability scanning starting at ₩9,900/month',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: 'https://vibescan.co.kr/en/pricing',
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

export default function PricingLayoutEN({
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