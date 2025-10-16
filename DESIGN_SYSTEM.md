# VibeScan 디자인 시스템

## 개요

VibeScan의 디자인 시스템은 **Simple UX Kit** 원칙을 기반으로 하며, shadcn/ui 컴포넌트를 사용하여 구현되었습니다.

## 디자인 원칙

### 1. Clarity (명확성)
사용자가 기능을 쉽게 이해하고 다음 행동을 예측할 수 있도록 설계합니다.

### 2. Simplicity (단순성)
불필요한 모든 요소를 제거하고, 핵심 기능에 집중합니다.

### 3. Consistency (일관성)
어떤 화면에서도 동일한 경험을 할 수 있도록 일관된 디자인 시스템을 유지합니다.

### 4. Efficiency (효율성)
최소한의 동작으로 원하는 목표를 달성할 수 있도록 돕습니다.

## 색상 팔레트

### Primary Colors
```css
--primary: #0064FF     /* Primary Blue - 핵심 액션, 브랜딩 */
--secondary: #FFD600   /* Secondary Yellow - 강조, 이벤트 */
```

### Semantic Colors
```css
--success: #22C55E     /* Success Green */
--error: #EF4444       /* Error Red */
--warning: #F59E0B     /* Warning Orange */
--info: #3B82F6        /* Info Blue */
```

### Grayscale
```css
--gray-900: #111827    /* 본문 텍스트 */
--gray-700: #374151    /* 보조 텍스트 */
--gray-500: #6B7280    /* 비활성화 텍스트 */
--gray-300: #D1D5DB    /* 구분선 */
--gray-100: #F3F4F6    /* 은은한 배경 */
--white: #FFFFFF       /* 기본 배경 */
```

## 타이포그래피

### Font Family
```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto,
             'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR',
             'Malgun Gothic', sans-serif;
```

### Font Sizes
```css
--text-display: 48px / 60px (font-weight: 800)
--text-h1: 32px / 40px (font-weight: 700)
--text-h2: 24px / 32px (font-weight: 700)
--text-body: 16px / 24px (font-weight: 400)
--text-caption: 12px / 16px (font-weight: 400)
```

## 레이아웃

### Grid System
- **Columns**: 12
- **Gutter**: 24px
- **Margin**: 16px

### Spacing Scale
```css
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

## 컴포넌트

### Button

#### Variants
- **primary**: 주요 액션 (파란색 배경, 흰색 텍스트)
- **secondary**: 보조 액션 (회색 배경)
- **success**: 성공/완료 (초록색)
- **danger**: 위험/삭제 (빨간색)
- **outline**: 테두리만 있는 버튼
- **ghost**: 배경 없는 버튼

#### Sizes
- **sm**: h-9 px-4
- **md**: h-12 px-6 (default)
- **lg**: h-14 px-8
- **icon**: h-10 w-10

#### 사용 예시
```tsx
import { Button } from "@/components/ui/button"

<Button variant="primary" size="md">
  스캔 시작
</Button>
```

### Card

그림자와 테두리가 있는 컨테이너 컴포넌트

#### 구성 요소
- **Card**: 메인 컨테이너
- **CardHeader**: 헤더 영역
- **CardTitle**: 제목
- **CardDescription**: 설명
- **CardContent**: 본문
- **CardFooter**: 푸터

#### 사용 예시
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>보안 스캔</CardTitle>
    <CardDescription>취약점을 검사합니다</CardDescription>
  </CardHeader>
  <CardContent>
    스캔 결과...
  </CardContent>
</Card>
```

### Badge

상태나 레이블을 표시하는 작은 태그

#### Variants
- **default**: 파란색
- **secondary**: 회색
- **success**: 초록색
- **warning**: 주황색
- **danger**: 빨간색
- **info**: 밝은 파란색
- **outline**: 테두리만

#### 사용 예시
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="success">완료</Badge>
<Badge variant="danger">실패</Badge>
```

### Input

텍스트 입력 필드

#### States
- **default**: 기본 상태
- **focus**: 파란색 테두리 + 그림자
- **disabled**: 회색 배경, 클릭 불가

#### 사용 예시
```tsx
import { Input } from "@/components/ui/input"

<Input
  type="email"
  placeholder="example@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

## 아이콘

**lucide-react** 라이브러리 사용

### 자주 사용하는 아이콘
- `Shield`: 보안, 보호
- `Zap`: 빠름, 성능
- `TrendingUp`: 증가, 개선
- `CheckCircle2`: 완료, 성공
- `XCircle`: 실패, 에러
- `AlertTriangle`: 경고
- `Clock`: 시간
- `Star`: 즐겨찾기, 인기
- `Award`: 등급, 성취

### 사용 예시
```tsx
import { Shield, CheckCircle2 } from "lucide-react"

<Shield className="w-6 h-6 text-[#0064FF]" />
<CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
```

## 페이지 구조

### 랜딩 페이지 (/)
- 히어로 섹션: 큰 제목 + CTA
- 기능 소개: 3열 카드 레이아웃
- 요금제: 4열 카드 레이아웃
- 푸터: 간단한 정보

### 로그인/회원가입 (/login, /register)
- 중앙 정렬 카드
- 로고 + 폼
- 링크 (로그인 ↔ 회원가입)

### 대시보드 (/dashboard)
- 헤더: 로고 + 사용자 정보 + 로그아웃
- 통계 카드: 3열 그리드
- 새 스캔 폼
- 스캔 목록: 세로 리스트

## 반응형 디자인

### Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### 모바일 우선 (Mobile-First)
```tsx
<div className="flex flex-col md:flex-row">
  {/* 모바일: 세로, 데스크톱: 가로 */}
</div>

<div className="grid grid-cols-1 md:grid-cols-3">
  {/* 모바일: 1열, 데스크톱: 3열 */}
</div>
```

## 애니메이션 & 트랜지션

### Hover Effects
```tsx
<Card className="hover:shadow-lg transition-shadow">
  {/* 마우스 오버 시 그림자 증가 */}
</Card>

<Button className="hover:opacity-80 transition-opacity">
  {/* 마우스 오버 시 투명도 변경 */}
</Button>
```

### Loading States
```tsx
<Shield className="animate-pulse" />
```

## 접근성 (Accessibility)

- **Focus visible**: 키보드 네비게이션을 위한 포커스 링
- **ARIA labels**: 스크린 리더를 위한 레이블
- **Semantic HTML**: 의미 있는 HTML 태그 사용
- **Color contrast**: WCAG AA 기준 준수

## Utils

### cn() 함수
Tailwind 클래스를 조건부로 결합

```tsx
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

## 프로젝트 구조

```
frontend/
├── app/
│   ├── page.tsx              # 랜딩 페이지
│   ├── login/page.tsx        # 로그인
│   ├── register/page.tsx     # 회원가입
│   ├── dashboard/page.tsx    # 대시보드
│   ├── layout.tsx            # 루트 레이아웃
│   └── globals.css           # 전역 스타일
├── components/
│   └── ui/                   # shadcn/ui 컴포넌트
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── input.tsx
└── lib/
    └── utils.ts              # 유틸리티 함수
```

## 개발 가이드라인

### 1. 컴포넌트 재사용
기존 UI 컴포넌트를 최대한 재사용하고, 필요시에만 새 컴포넌트 생성

### 2. 일관성 유지
색상, 간격, 폰트 크기는 디자인 시스템에 정의된 값만 사용

### 3. 반응형 우선
모든 컴포넌트는 모바일 화면을 먼저 고려

### 4. 성능 최적화
- 이미지 최적화 (Next.js Image 컴포넌트)
- 코드 스플리팅
- 클라이언트 컴포넌트 최소화

## 참고 자료

- [shadcn/ui 공식 문서](https://ui.shadcn.com)
- [Tailwind CSS 문서](https://tailwindcss.com)
- [Radix UI 문서](https://www.radix-ui.com)
- [Lucide Icons](https://lucide.dev)

---

**버전**: 1.0.0
**마지막 업데이트**: 2025-10-13
