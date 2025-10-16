# VibeScan 분리 배포 가이드 (Netlify + GCP)

프론트엔드를 **Netlify**에, 백엔드를 **GCP Cloud Run**에 배포하는 가이드입니다.

## 📋 목차
- [아키텍처 개요](#아키텍처-개요)
- [사전 준비](#사전-준비)
- [GCP 백엔드 배포](#gcp-백엔드-배포)
- [Netlify 프론트엔드 배포](#netlify-프론트엔드-배포)
- [비용 예상](#비용-예상)
- [트러블슈팅](#트러블슈팅)

## 🏗️ 아키텍처 개요

```
사용자
  ↓
Netlify (프론트엔드)
  ↓ HTTPS
GCP Cloud Run (백엔드)
  ↓
Cloud SQL (PostgreSQL)
Memorystore (Redis)
```

### 장점
- **프론트엔드**: Netlify의 글로벌 CDN으로 빠른 로딩
- **백엔드**: Cloud Run의 자동 스케일링
- **관리 편의성**: 각 서비스의 전문 도구 활용

### 단점
- **비용**: 단일 서버 대비 약 2-3배 (월 $80-120)
- **복잡성**: 두 플랫폼 관리 필요
- **네트워크 레이턴시**: 프론트-백엔드 간 통신 지연

---

## 🔧 사전 준비

### 1. 계정 생성
- **GCP 계정**: https://console.cloud.google.com/
- **Netlify 계정**: https://app.netlify.com/

### 2. 필수 도구 설치

#### gcloud CLI 설치 (macOS)
```bash
# Homebrew로 설치
brew install --cask google-cloud-sdk

# 인증
gcloud auth login

# 프로젝트 생성 및 설정
gcloud projects create vibescan-PROJECT_ID
gcloud config set project vibescan-PROJECT_ID

# Billing 활성화 (GCP Console에서 수동으로)
# https://console.cloud.google.com/billing
```

#### Netlify CLI 설치
```bash
npm install -g netlify-cli

# 로그인
netlify login
```

### 3. GCP API 활성화
```bash
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  container.googleapis.com
```

---

## 🚀 GCP 백엔드 배포

### 1단계: Cloud SQL (PostgreSQL) 생성

```bash
# Cloud SQL 인스턴스 생성
gcloud sql instances create vibescan-db \
  --database-version=POSTGRES_15 \
  --cpu=2 \
  --memory=7680MB \
  --region=asia-northeast3 \
  --root-password=YOUR_STRONG_PASSWORD

# 데이터베이스 생성
gcloud sql databases create vibescan \
  --instance=vibescan-db

# 사용자 생성
gcloud sql users create vibescan \
  --instance=vibescan-db \
  --password=YOUR_DB_PASSWORD
```

**비용**: 약 $50-70/월 (db-custom-2-7680)

### 2단계: Memorystore (Redis) 생성

```bash
# Redis 인스턴스 생성
gcloud redis instances create vibescan-redis \
  --size=1 \
  --region=asia-northeast3 \
  --redis-version=redis_7_0

# Redis 접속 정보 확인
gcloud redis instances describe vibescan-redis \
  --region=asia-northeast3
```

**비용**: 약 $30-40/월 (1GB 인스턴스)

### 3단계: Secret Manager 환경변수 설정

```bash
# 각 환경변수를 Secret으로 저장
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
echo -n "YOUR_JWT_REFRESH_SECRET" | gcloud secrets create jwt-refresh-secret --data-file=-
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_TOSS_SECRET_KEY" | gcloud secrets create toss-secret-key --data-file=-
echo -n "YOUR_TOSS_CLIENT_KEY" | gcloud secrets create toss-client-key --data-file=-

# OAuth secrets
echo -n "YOUR_GOOGLE_CLIENT_ID" | gcloud secrets create google-client-id --data-file=-
echo -n "YOUR_GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "YOUR_KAKAO_CLIENT_ID" | gcloud secrets create kakao-client-id --data-file=-
echo -n "YOUR_KAKAO_CLIENT_SECRET" | gcloud secrets create kakao-client-secret --data-file=-
```

### 4단계: Cloud Build 트리거 설정

```bash
# GitHub 저장소 연결 (처음 한 번만)
gcloud beta builds connections create github my-github-conn \
  --region=asia-northeast3

# Cloud Build 트리거 생성
gcloud builds triggers create github \
  --name=vibescan-backend-deploy \
  --region=asia-northeast3 \
  --repo-name=vibescan \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern=^main$ \
  --build-config=backend/cloudbuild.yaml \
  --included-files=backend/**
```

### 5단계: 수동 배포 (첫 배포)

```bash
cd backend

# Docker 이미지 빌드 및 푸시
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD)
```

배포 완료 후 Cloud Run URL을 확인:
```bash
gcloud run services describe vibescan-backend \
  --region=asia-northeast3 \
  --format='value(status.url)'
```

예시 URL: `https://vibescan-backend-XXXXX-an.a.run.app`

### 6단계: Cloud Run 환경변수 설정

```bash
# Cloud SQL 연결 문자열 가져오기
CLOUD_SQL_CONNECTION=$(gcloud sql instances describe vibescan-db \
  --format='value(connectionName)')

# Redis 호스트 가져오기
REDIS_HOST=$(gcloud redis instances describe vibescan-redis \
  --region=asia-northeast3 \
  --format='value(host)')

# Cloud Run 서비스 업데이트
gcloud run services update vibescan-backend \
  --region=asia-northeast3 \
  --add-cloudsql-instances=${CLOUD_SQL_CONNECTION} \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="DATABASE_HOST=/cloudsql/${CLOUD_SQL_CONNECTION}" \
  --set-env-vars="DATABASE_PORT=5432" \
  --set-env-vars="DATABASE_NAME=vibescan" \
  --set-env-vars="DATABASE_USER=vibescan" \
  --set-env-vars="REDIS_HOST=${REDIS_HOST}" \
  --set-env-vars="REDIS_PORT=6379" \
  --set-secrets="JWT_SECRET=jwt-secret:latest" \
  --set-secrets="JWT_REFRESH_SECRET=jwt-refresh-secret:latest" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest" \
  --set-secrets="TOSS_SECRET_KEY=toss-secret-key:latest" \
  --set-secrets="TOSS_CLIENT_KEY=toss-client-key:latest" \
  --set-secrets="GOOGLE_CLIENT_ID=google-client-id:latest" \
  --set-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest" \
  --set-secrets="KAKAO_CLIENT_ID=kakao-client-id:latest" \
  --set-secrets="KAKAO_CLIENT_SECRET=kakao-client-secret:latest"
```

---

## 🌐 Netlify 프론트엔드 배포

### 1단계: Netlify 사이트 생성

```bash
cd frontend

# Netlify에 로그인
netlify login

# 새 사이트 초기화
netlify init
```

또는 Netlify 웹 UI에서:
1. https://app.netlify.com/start
2. GitHub 저장소 연결
3. 빌드 설정:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Base directory**: `frontend`

### 2단계: 환경변수 설정

Netlify UI에서 환경변수 설정:
1. Site settings → Environment variables
2. 다음 변수 추가:

```bash
# GCP Cloud Run URL (4단계에서 확인한 URL)
NEXT_PUBLIC_API_URL=https://vibescan-backend-XXXXX-an.a.run.app/api

# Node 환경
NODE_ENV=production

# Next.js Standalone 모드
NEXT_PRIVATE_STANDALONE=true
```

또는 CLI로 설정:
```bash
netlify env:set NEXT_PUBLIC_API_URL "https://vibescan-backend-XXXXX-an.a.run.app/api"
netlify env:set NODE_ENV "production"
```

### 3단계: netlify.toml 확인

`frontend/netlify.toml` 파일에서 백엔드 URL 업데이트:

```toml
[build.environment]
  NEXT_PUBLIC_API_URL = "https://vibescan-backend-XXXXX-an.a.run.app/api"

[[redirects]]
  from = "/api/*"
  to = "https://vibescan-backend-XXXXX-an.a.run.app/api/:splat"
  status = 200
  force = true
```

### 4단계: 배포

```bash
# Git으로 배포 (자동)
git add .
git commit -m "Deploy to Netlify + GCP"
git push origin main

# 또는 수동 배포
netlify deploy --prod
```

### 5단계: 커스텀 도메인 설정 (선택)

Netlify UI에서:
1. Site settings → Domain management
2. Add custom domain
3. DNS 레코드 업데이트:
   - `CNAME`: `www` → `YOUR_SITE.netlify.app`
   - `A`: `@` → Netlify IP

---

## 📊 비용 예상

### GCP 비용 (월간)
| 서비스 | 스펙 | 예상 비용 |
|--------|------|-----------|
| Cloud Run | 2 vCPU, 2GB RAM, 최소 1 인스턴스 | $20-30 |
| Cloud SQL | PostgreSQL, 2 vCPU, 7.5GB RAM | $50-70 |
| Memorystore (Redis) | 1GB | $30-40 |
| Cloud Build | 무료 (120분/일) | $0 |
| **합계** | | **$100-140** |

### Netlify 비용
| 플랜 | 비용 | 포함 사항 |
|------|------|-----------|
| Starter | **무료** | 100GB 대역폭, 300분 빌드 |
| Pro | $19/월 | 1TB 대역폭, 25000분 빌드 |

### 총 예상 비용
- **최소**: $100/월 (GCP) + $0 (Netlify) = **$100/월**
- **권장**: $120/월 (GCP) + $19 (Netlify Pro) = **$139/월**

---

## 🔄 CI/CD 워크플로우

### 자동 배포 흐름

1. **코드 푸시** (`git push origin main`)
2. **백엔드**: Cloud Build 트리거 → Docker 빌드 → Cloud Run 배포
3. **프론트엔드**: Netlify 자동 빌드 및 배포
4. **완료**: 약 5-10분 소요

### 수동 배포

#### 백엔드 재배포
```bash
cd backend
gcloud builds submit --config cloudbuild.yaml
```

#### 프론트엔드 재배포
```bash
cd frontend
netlify deploy --prod
```

---

## 🛠️ 트러블슈팅

### 1. CORS 에러

**문제**: 프론트엔드에서 백엔드 API 호출 시 CORS 에러

**해결**:
1. `backend/src/main.ts`에서 Netlify 도메인이 허용되었는지 확인
2. Cloud Run 환경변수에 `FRONTEND_URL` 추가:
```bash
gcloud run services update vibescan-backend \
  --region=asia-northeast3 \
  --set-env-vars="FRONTEND_URL=https://YOUR_SITE.netlify.app"
```

### 2. Cloud SQL 연결 실패

**문제**: 백엔드에서 데이터베이스 연결 불가

**해결**:
```bash
# Cloud SQL Proxy 연결 확인
gcloud run services describe vibescan-backend \
  --region=asia-northeast3 \
  --format='value(spec.template.spec.containers[0].volumes)'

# 재설정
gcloud run services update vibescan-backend \
  --region=asia-northeast3 \
  --add-cloudsql-instances=PROJECT_ID:REGION:vibescan-db
```

### 3. Netlify 빌드 실패

**문제**: Next.js 빌드 타임아웃 또는 메모리 부족

**해결**:
```bash
# package.json에 빌드 옵션 추가
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

또는 Netlify Pro 플랜으로 업그레이드 (더 많은 리소스)

### 4. 환경변수 미적용

**문제**: 배포 후 환경변수가 적용되지 않음

**해결**:
```bash
# Netlify CLI로 확인
netlify env:list

# GCP Secret Manager 확인
gcloud secrets versions access latest --secret="jwt-secret"

# Cloud Run 환경변수 확인
gcloud run services describe vibescan-backend \
  --region=asia-northeast3 \
  --format='value(spec.template.spec.containers[0].env)'
```

---

## 📞 지원 및 문의

문제가 발생하면:
1. 로그 확인:
   - **GCP**: Cloud Run 로그 - https://console.cloud.google.com/run
   - **Netlify**: Deploy 로그 - https://app.netlify.com/
2. [GitHub Issues](https://github.com/YOUR_USERNAME/vibescan/issues)에 보고
3. 이메일: ggprgrkjh2@gmail.com

---

## 📚 추가 리소스

- [Netlify 문서](https://docs.netlify.com/)
- [GCP Cloud Run 문서](https://cloud.google.com/run/docs)
- [Cloud SQL 문서](https://cloud.google.com/sql/docs)
- [Memorystore 문서](https://cloud.google.com/memorystore/docs/redis)
