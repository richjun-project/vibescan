import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://vibescan.io'),
  title: 'VibeScan - 웹 보안 점검 서비스',
  description: '개발자를 위한 자동화된 보안 취약점 스캔 및 랭킹 서비스',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'VibeScan - 웹 보안 점검 서비스',
    description: '개발자를 위한 자동화된 보안 취약점 스캔 및 랭킹 서비스',
    images: ['/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VibeScan - 웹 보안 점검 서비스',
    description: '개발자를 위한 자동화된 보안 취약점 스캔 및 랭킹 서비스',
    images: ['/logo.png'],
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
