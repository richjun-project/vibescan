"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import {
  isInAppBrowser,
  openInExternalBrowser,
  getInAppBrowserWarning,
  getCurrentPageUrl,
} from "@/lib/browser-detection"

interface OAuthButtonProps {
  provider: "google"
  lang?: "ko" | "en"
  className?: string
  children?: React.ReactNode
}

export function OAuthButton({ provider, lang = "ko", className, children }: OAuthButtonProps) {
  const [isInApp, setIsInApp] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setMounted(true)
    setIsInApp(isInAppBrowser())
  }, [])

  const handleOAuthClick = () => {
    // 인앱 브라우저인 경우 경고 표시
    if (isInApp) {
      setShowWarning(true)
      return
    }

    // 일반 브라우저인 경우 OAuth 플로우 진행
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
    window.location.href = `${backendUrl}/auth/${provider}`
  }

  const handleExternalBrowserOpen = () => {
    const currentUrl = getCurrentPageUrl()
    openInExternalBrowser(currentUrl)
    setShowWarning(false)
  }

  const warningContent = getInAppBrowserWarning(lang)

  // 서버 사이드 렌더링 중에는 기본 버튼만 표시
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        className={className}
        disabled
      >
        {children || (lang === "en" ? "Continue with Google" : "Google로 계속하기")}
      </Button>
    )
  }

  return (
    <>
      {/* 인앱 브라우저 경고 배너 */}
      {isInApp && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {lang === "en"
              ? "You are using an in-app browser. Google login may not work properly."
              : "인앱 브라우저를 사용 중입니다. 구글 로그인이 정상적으로 작동하지 않을 수 있습니다."}
          </AlertDescription>
        </Alert>
      )}

      {/* OAuth 버튼 */}
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={handleOAuthClick}
        aria-label={provider === "google" ? (lang === "en" ? "Sign in with Google" : "Google 계정으로 로그인") : ""}
      >
        {children}
      </Button>

      {/* 인앱 브라우저 경고 다이얼로그 */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
              <AlertCircle className="h-5 w-5 text-red-600" />
              {warningContent.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed text-gray-700">
              {warningContent.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-2">
            <p className="text-sm text-blue-900 font-medium mb-2">
              {lang === "en" ? "How to proceed:" : "진행 방법:"}
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>
                {lang === "en"
                  ? "Tap the button below to open in external browser"
                  : "아래 버튼을 눌러 외부 브라우저로 열기"}
              </li>
              <li>
                {lang === "en"
                  ? `Or use the menu in ${warningContent.browserName} (⋮) and select "Open in Browser"`
                  : `또는 ${warningContent.browserName} 메뉴(⋮)에서 "브라우저에서 열기" 선택`}
              </li>
            </ol>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {lang === "en" ? "Cancel" : "취소"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExternalBrowserOpen}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              {warningContent.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// 구글 로그인 전용 버튼 (기본 스타일 포함)
export function GoogleOAuthButton({ lang = "ko", className }: { lang?: "ko" | "en"; className?: string }) {
  return (
    <OAuthButton
      provider="google"
      lang={lang}
      className={className || "w-full flex items-center justify-center gap-3 hover:bg-gray-50"}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>{lang === "en" ? "Continue with Google" : "Google로 계속하기"}</span>
    </OAuthButton>
  )
}
