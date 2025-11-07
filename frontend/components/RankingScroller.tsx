'use client'

import { useEffect, useState } from 'react'

interface RankingItem {
  rank: number
  domain: string
  grade: string
  score?: number
  completedAt?: string
}

export default function RankingScroller() {
  const [rankings, setRankings] = useState<RankingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="w-full py-8 bg-gray-50">
        <div className="text-center text-gray-500">
          랭킹을 불러오는 중...
        </div>
      </div>
    )
  }

  if (rankings.length === 0) {
    return (
      <div className="w-full py-8 bg-gray-50">
        <div className="text-center text-gray-500">
          아직 공유된 스캔 결과가 없습니다.
        </div>
      </div>
    )
  }

  // Duplicate rankings for seamless infinite scroll
  const duplicatedRankings = [...rankings, ...rankings, ...rankings]

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'C':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'D':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="w-full py-12 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          🏆 실시간 보안 랭킹
        </h2>
        <p className="text-center text-gray-600">
          최근 공유된 웹사이트 보안 스캔 결과
        </p>
      </div>

      <div className="relative">
        <div className="flex gap-4 animate-scroll">
          {duplicatedRankings.map((item, index) => (
            <div
              key={`${item.domain}-${index}`}
              className={`flex-shrink-0 w-80 p-4 rounded-lg border-2 shadow-md ${getGradeColor(item.grade)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">#{item.rank}</span>
                  <span className={`px-3 py-1 rounded-full font-bold text-lg ${getGradeColor(item.grade)}`}>
                    {item.grade}
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-700 truncate">
                {item.domain}
              </div>
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
            transform: translateX(-33.333%);
          }
        }

        .animate-scroll {
          display: flex;
          animation: scroll 60s linear infinite;
          width: max-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
