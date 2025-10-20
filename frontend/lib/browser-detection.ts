/**
 * 인앱 브라우저 감지 및 외부 브라우저 유도 유틸리티
 *
 * 구글 OAuth는 보안 정책상 인앱 브라우저(WebView)에서 차단됩니다.
 * 이 파일은 인앱 브라우저를 감지하고 외부 브라우저로 유도하는 기능을 제공합니다.
 */

/**
 * User-Agent를 기반으로 인앱 브라우저인지 감지합니다.
 *
 * @returns {boolean} 인앱 브라우저이면 true, 일반 브라우저이면 false
 */
export function isInAppBrowser(): boolean {
  // 서버 사이드 렌더링 환경에서는 false 반환
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // 주요 인앱 브라우저 패턴 매칭
  const inAppBrowserPatterns = [
    // 카카오톡
    /KAKAOTALK/i,
    /KakaoTalk/i,

    // 네이버
    /NAVER/i,
    /Naver/i,

    // 페이스북/메신저
    /FBAN/i,
    /FBAV/i,
    /FB_IAB/i,
    /FB4A/i,

    // 인스타그램
    /Instagram/i,

    // 라인
    /Line/i,

    // 트위터
    /Twitter/i,

    // 스레드
    /BarcelonaAndroid/i, // Android Threads
    /Barcelona/i,         // iOS Threads

    // 링크드인
    /LinkedInApp/i,

    // 틱톡
    /musical_ly/i,
    /BytedanceWebview/i,

    // 왓츠앱
    /WhatsApp/i,

    // 기타 WebView 패턴
    /wv/i, // Android WebView
  ]

  // 패턴 중 하나라도 매칭되면 인앱 브라우저로 판단
  const isInApp = inAppBrowserPatterns.some(pattern => pattern.test(userAgent))

  // 추가 체크: Chrome/Safari가 아닌 경우 (iOS에서 일부 앱들이 User-Agent를 숨기는 경우)
  const isChrome = /Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)
  const isFirefox = /Firefox/i.test(userAgent)
  const isEdge = /Edg/i.test(userAgent)

  // 일반적인 브라우저가 아니고, 인앱 패턴이 감지된 경우
  if (isInApp) {
    return true
  }

  // 모바일이면서 일반 브라우저가 아닌 경우 (추가 안전장치)
  const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent)
  const isStandardBrowser = isChrome || isSafari || isFirefox || isEdge

  // 모바일인데 표준 브라우저가 아니면 인앱일 가능성이 높음
  if (isMobile && !isStandardBrowser) {
    return true
  }

  return false
}

/**
 * 현재 브라우저의 이름을 감지합니다.
 *
 * @returns {string} 브라우저 이름 (예: "KakaoTalk", "Instagram", "Facebook" 등)
 */
export function detectBrowserName(): string {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Unknown'
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  if (/KAKAOTALK/i.test(userAgent)) return 'KakaoTalk'
  if (/NAVER/i.test(userAgent)) return 'Naver'
  if (/Instagram/i.test(userAgent)) return 'Instagram'
  if (/FBAN|FBAV|FB_IAB|FB4A/i.test(userAgent)) return 'Facebook'
  if (/Line/i.test(userAgent)) return 'Line'
  if (/Twitter/i.test(userAgent)) return 'Twitter'
  if (/BarcelonaAndroid|Barcelona/i.test(userAgent)) return 'Threads'
  if (/LinkedInApp/i.test(userAgent)) return 'LinkedIn'
  if (/musical_ly|BytedanceWebview/i.test(userAgent)) return 'TikTok'
  if (/WhatsApp/i.test(userAgent)) return 'WhatsApp'

  if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) return 'Chrome'
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari'
  if (/Firefox/i.test(userAgent)) return 'Firefox'
  if (/Edg/i.test(userAgent)) return 'Edge'

  return 'Unknown Browser'
}

/**
 * 외부 브라우저에서 URL을 여는 함수
 *
 * iOS의 경우 특수한 처리가 필요하며, Android는 intent를 사용합니다.
 *
 * @param {string} url - 외부 브라우저에서 열 URL
 * @returns {boolean} 외부 브라우저 열기 시도 성공 여부
 */
export function openInExternalBrowser(url: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)

  try {
    if (isIOS) {
      // iOS에서는 사용자가 수동으로 Safari로 열기를 해야 합니다
      // 일부 인앱 브라우저는 메뉴에 "Safari에서 열기" 옵션을 제공합니다

      // 시도 1: URL scheme을 통한 Safari 열기 (제한적으로 작동)
      const safariUrl = `x-safari-https://${url.replace(/^https?:\/\//, '')}`
      window.location.href = safariUrl

      // fallback: 일반 URL로 시도
      setTimeout(() => {
        window.location.href = url
      }, 500)

      return true
    } else if (isAndroid) {
      // Android에서는 intent를 사용하여 외부 브라우저로 열 수 있습니다
      const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;end`
      window.location.href = intentUrl

      // fallback
      setTimeout(() => {
        window.location.href = url
      }, 500)

      return true
    } else {
      // 데스크톱이나 기타 환경에서는 일반적인 방법으로 열기
      window.open(url, '_blank')
      return true
    }
  } catch (error) {
    console.error('Failed to open external browser:', error)
    // fallback으로 현재 창에서 열기
    window.location.href = url
    return false
  }
}

/**
 * 인앱 브라우저에서 OAuth를 진행하려는 경우 경고 메시지를 생성합니다.
 *
 * @param {string} lang - 언어 코드 ('ko' 또는 'en')
 * @returns {object} 경고 메시지 객체
 */
export function getInAppBrowserWarning(lang: 'ko' | 'en' = 'ko'): {
  title: string
  message: string
  action: string
  browserName: string
} {
  const browserName = detectBrowserName()

  if (lang === 'en') {
    return {
      title: 'Login Unavailable in In-App Browser',
      message: `You are currently using ${browserName}'s in-app browser. Google login is blocked in in-app browsers for security reasons. Please open this page in an external browser (Safari, Chrome, etc.).`,
      action: 'Open in External Browser',
      browserName,
    }
  }

  return {
    title: '인앱 브라우저에서는 로그인이 불가능합니다',
    message: `현재 ${browserName}의 인앱 브라우저를 사용하고 계십니다. 보안 정책상 인앱 브라우저에서는 구글 로그인이 차단됩니다. 외부 브라우저(Safari, Chrome 등)에서 이 페이지를 열어주세요.`,
    action: '외부 브라우저에서 열기',
    browserName,
  }
}

/**
 * 현재 페이지 URL을 가져옵니다 (외부 브라우저로 전달할 때 사용)
 *
 * @returns {string} 현재 페이지의 전체 URL
 */
export function getCurrentPageUrl(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.href
}
