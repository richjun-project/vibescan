'use client'

import { useEffect, useState } from 'react'

interface RankingItem {
  rank: number
  domain: string
  grade: string
  score?: number
  completedAt?: string
}

interface RankingScrollerProps {
  lang?: 'ko' | 'en'
}

export default function RankingScroller({ lang = 'ko' }: RankingScrollerProps) {
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const texts = {
    ko: {
      title: '🏆 실시간 보안 랭킹',
      subtitle: '최근 공유된 웹사이트 보안 스캔 결과',
      loading: '랭킹을 불러오는 중...',
      empty: '아직 공유된 스캔 결과가 없습니다.',
    },
    en: {
      title: '🏆 Live Security Rankings',
      subtitle: 'Recently shared website security scan results',
      loading: 'Loading rankings...',
      empty: 'No shared scan results yet.',
    },
  }

  const t = texts[lang]

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000/api'
        const response = await fetch(`${backendUrl}/scans/public/rankings?limit=50`)
        const data = await response.json()
        setRankings(data)
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [])

  if (isLoading) {
    return (
      <div className="w-full py-12 bg-white">
        <div className="text-center text-gray-500">
          {t.loading}
        </div>
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="w-full py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center py-12 p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-3xl">
            <p className="text-gray-500">{t.empty}</p>
          </div>
        </div>
      </div>
    )
  }

  // Duplicate rankings for seamless infinite scroll (only 2x to reduce duplication)
  const duplicatedRankings = [...rankings, ...rankings]

  const getGradeBadgeStyle = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-500 text-white'
      case 'B':
        return 'bg-blue-500 text-white'
      case 'C':
        return 'bg-orange-500 text-white'
      case 'D':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="w-full py-16 bg-white border-y border-gray-200 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {t.title}
        </h2>
        <p className="text-center text-gray-600">
          {t.subtitle}
        </p>
      </div>

      <div className="relative">
        {/* Gradient overlays for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex gap-4 animate-scroll px-4">
          {duplicatedRankings.map((item, index) => (
            <div
              key={`${item.domain}-${item.rank}-${index}`}
              className="flex-shrink-0 w-80 p-6 bg-white border-2 border-gray-200 rounded-3xl shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">#{item.rank}</span>
                  <span className={`px-4 py-1.5 rounded-full font-bold text-base ${getGradeBadgeStyle(item.grade)} shadow-sm`}>
                    {item.grade}
                  </span>
                </div>
              </div>
              <div className="text-base font-semibold text-gray-700 truncate">
                {item.domain}
              </div>
              {item.completedAt && (
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(item.completedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          display: flex;
          animation: scroll 90s linear infinite;
          width: max-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
