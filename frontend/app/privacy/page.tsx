"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function PrivacyPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Notion privacy policy page
    window.location.href = "https://relic-baboon-412.notion.site/vibescan-28f766a8bb4680c39a9fd2841f623f93?pvs=73"
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">개인정보 처리방침으로 이동 중...</p>
      </div>
    </div>
  )
}
