import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://vibescan.co.kr'),
  title: 'VibeScan - Web Security Scanning Service',
  description: 'Automated security vulnerability scanning and AI analysis service for developers. Detect 12,000+ vulnerabilities with Nuclei & ZAP in 5 minutes.',
  keywords: ['web security', 'vulnerability scanning', 'security audit', 'OWASP', 'Nuclei', 'ZAP', 'penetration testing', 'DevSecOps', 'security scanner', 'vulnerability assessment'],
  authors: [{ name: 'silverithm' }],
  alternates: {
    canonical: 'https://vibescan.co.kr/en',
    languages: {
      'ko-KR': 'https://vibescan.co.kr/',
      'en-US': 'https://vibescan.co.kr/en',
      'x-default': 'https://vibescan.co.kr/',
    },
  },
  openGraph: {
    title: 'VibeScan - Web Security Scanning Service',
    description: 'Automated security vulnerability scanning and AI analysis service for developers. Detect 12,000+ vulnerabilities with Nuclei & ZAP in 5 minutes.',
    url: 'https://vibescan.co.kr/en',
    siteName: 'VibeScan',
    images: [
      {
        url: '/logo2.png',
        width: 1200,
        height: 630,
        alt: 'VibeScan - Web Security Scanning Service',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeScan - Web Security Scanning Service',
    description: 'Automated security vulnerability scanning and AI analysis service for developers',
    images: [
      {
        url: '/logo2.png',
        alt: 'VibeScan - Web Security Scanning Service',
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

export default function EnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}