# VibeScan Backend 설치 가이드

## 1. 데이터베이스 시작

```bash
# 프로젝트 루트에서
cd /Users/gimjunhyeong/Develop/vibescan
docker-compose up -d

# 확인
docker-compose ps
```

## 2. Backend 의존성 설치

```bash
cd backend
npm install
```

## 3. 환경변수 설정

`.env` 파일이 이미 생성되어 있습니다. 필요시 수정:

```bash
# AI API 키 추가 (선택사항)
ANTHROPIC_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
```

## 4. 데이터베이스 스키마 생성

```bash
# 옵션 A: 스키마 자동 생성 (개발용)
npm run schema:create

# 옵션 B: 마이그레이션 사용 (프로덕션 권장)
npm run migration:create
npm run migration:up
```

## 5. 서버 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run build
npm run start:prod
```

서버가 http://localhost:3000 에서 실행됩니다.

## 6. API 테스트

### 회원가입
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "테스터"
  }'
```

### 로그인
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

응답에서 `accessToken`을 복사합니다.

### 스캔 생성
```bash
curl -X POST http://localhost:3000/api/scans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com"
  }'
```

### 내 스캔 목록
```bash
curl -X GET http://localhost:3000/api/scans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 문제 해결

### Port 이미 사용 중
```bash
# 3000번 포트를 사용하는 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 PID
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 컨테이너 상태 확인
docker ps | grep postgres

# 로그 확인
docker logs vibescan-postgres

# 재시작
docker-compose restart postgres
```

### 스키마 재생성
```bash
# 모든 테이블 삭제 후 재생성
npm run schema:drop
npm run schema:create
```

## 개발 명령어

```bash
# 빌드
npm run build

# 개발 서버 (hot reload)
npm run start:dev

# 디버그 모드
npm run start:debug

# 스키마 업데이트
npm run schema:update

# 마이그레이션 생성
npm run migration:create

# 마이그레이션 실행
npm run migration:up

# 마이그레이션 롤백
npm run migration:down
```
