---
title: "개발자가 알아야 할 웹 보안 체크리스트 10가지"
description: "프로덕션 배포 전 반드시 확인해야 할 웹 보안 체크리스트를 제공합니다. 각 항목별 구체적인 구현 방법과 코드 예제를 포함합니다."
date: "2025-01-17"
author: "VibeScan Security Team"
tags: ["웹 보안", "체크리스트", "보안 가이드", "개발자"]
image: "/blog/security-checklist.png"
---

프로덕션 배포 전 보안을 체크하는 것은 필수입니다. 이 가이드는 모든 웹 개발자가 알아야 할 핵심 보안 체크리스트를 제공합니다.

## 1. HTTPS 사용 및 강제 리다이렉션

### 왜 중요한가?
HTTP는 암호화되지 않아 중간자 공격(Man-in-the-Middle)에 취약합니다.

### 구현 방법

#### Express.js에서 HTTPS 강제
```javascript
const express = require('express');
const app = express();

// HTTP에서 HTTPS로 리다이렉트
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// HSTS 헤더 설정
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

#### Next.js에서 설정
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};
```

### 체크리스트
- [ ] SSL/TLS 인증서 설치 (Let's Encrypt 무료)
- [ ] HTTP에서 HTTPS로 자동 리다이렉션
- [ ] HSTS 헤더 설정
- [ ] Mixed Content 제거 (HTTP 리소스 로드 금지)

---

## 2. 보안 헤더 설정

### 필수 보안 헤더

#### Helmet.js 사용 (권장)
```javascript
const helmet = require('helmet');
const app = express();

app.use(helmet());

// 또는 개별 설정
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"]
  }
}));

app.use(helmet.xssFilter());
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());
app.use(helmet.frameguard({ action: 'deny' }));
```

#### 수동 설정
```javascript
app.use((req, res, next) => {
  // XSS 보호
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // MIME 타입 스니핑 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 클릭재킹 방지
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 권한 정책
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
});
```

### 체크리스트
- [ ] Content-Security-Policy 설정
- [ ] X-Frame-Options 설정
- [ ] X-Content-Type-Options 설정
- [ ] Referrer-Policy 설정
- [ ] Permissions-Policy 설정

---

## 3. 인증 및 세션 관리

### JWT 기반 인증 (Stateless)

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// 로그인
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 사용자 조회
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: '잘못된 인증 정보' });
  }

  // 비밀번호 검증
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '잘못된 인증 정보' });
  }

  // JWT 토큰 생성
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // 1시간 후 만료
  );

  res.json({ token });
});

// 인증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
    }
    req.user = user;
    next();
  });
}

// 보호된 라우트
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
```

### 세션 기반 인증

```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

const redisClient = redis.createClient();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS에서만 전송
    httpOnly: true, // JavaScript에서 접근 불가
    maxAge: 3600000, // 1시간
    sameSite: 'strict' // CSRF 방지
  }
}));
```

### 체크리스트
- [ ] 비밀번호 해싱 (bcrypt, Argon2)
- [ ] 강력한 세션 secret 사용
- [ ] httpOnly, secure 쿠키 플래그 설정
- [ ] 세션 타임아웃 설정
- [ ] 로그아웃 시 세션 완전 삭제

---

## 4. 입력 검증 및 Sanitization

### Express Validator 사용

```javascript
const { body, validationResult } = require('express-validator');

app.post('/register',
  // 검증 규칙
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('비밀번호는 최소 8자, 대소문자, 숫자, 특수문자를 포함해야 합니다'),
  body('username')
    .isAlphanumeric()
    .isLength({ min: 3, max: 20 })
    .trim()
    .escape(),

  async (req, res) => {
    // 검증 에러 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // 안전한 입력값 사용
    const { email, password, username } = req.body;
    // 회원가입 로직...
  }
);
```

### XSS 방어 - DOMPurify 사용

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

app.post('/comment', async (req, res) => {
  const { content } = req.body;

  // HTML sanitize
  const clean = DOMPurify.sanitize(content);

  await Comment.create({ content: clean });
  res.json({ success: true });
});
```

### 체크리스트
- [ ] 모든 사용자 입력 검증
- [ ] 화이트리스트 방식 사용
- [ ] HTML 입력 시 sanitization
- [ ] 파일 업로드 시 확장자 및 MIME 타입 검증

---

## 5. CSRF 방어

### CSRF Token 사용

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });

// 폼 렌더링 시 토큰 포함
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// POST 요청 시 토큰 검증
app.post('/submit', csrfProtection, (req, res) => {
  res.json({ success: true });
});
```

### SameSite 쿠키 사용

```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' // 또는 'lax'
});
```

### 체크리스트
- [ ] CSRF 토큰 구현
- [ ] SameSite 쿠키 속성 설정
- [ ] 중요한 작업에 재인증 요구

---

## 6. Rate Limiting

### Express Rate Limit 사용

```javascript
const rateLimit = require('express-rate-limit');

// API 일반 제한
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// 로그인 엄격한 제한
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 15분에 5회만
  skipSuccessfulRequests: true, // 성공한 요청은 카운트 안함
});

app.post('/login', loginLimiter, loginHandler);

// IP별 제한
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // IP당 3개 계정만
  skipFailedRequests: true,
});

app.post('/register', createAccountLimiter, registerHandler);
```

### Redis를 사용한 분산 환경 Rate Limiting

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
```

### 체크리스트
- [ ] API 엔드포인트에 Rate Limiting 적용
- [ ] 로그인/회원가입에 엄격한 제한
- [ ] IP 기반 제한 구현

---

## 7. SQL Injection 방어

### Prepared Statements 사용

```javascript
// 잘못된 방법 ❌
const query = `SELECT * FROM users WHERE id = ${userId}`;

// 올바른 방법 ✅
const query = 'SELECT * FROM users WHERE id = ?';
const [rows] = await connection.execute(query, [userId]);
```

### ORM 사용

```javascript
const { Sequelize, DataTypes } = require('sequelize');

// Sequelize는 자동으로 Prepared Statements 사용
const user = await User.findOne({
  where: { email: userEmail }
});
```

### 체크리스트
- [ ] 모든 쿼리에 Prepared Statements 사용
- [ ] ORM 사용 시 raw query 최소화
- [ ] 입력값 검증 및 화이트리스트

---

## 8. 안전한 파일 업로드

### Multer를 사용한 안전한 파일 업로드

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // 랜덤 파일명 생성
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  }
});

// 파일 필터
const fileFilter = (req, file, cb) => {
  // 허용된 확장자
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  // 확장자 검증
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('허용되지 않은 파일 형식입니다'), false);
  }

  // MIME 타입 검증
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('허용되지 않은 파일 형식입니다'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '파일이 업로드되지 않았습니다' });
  }

  res.json({
    filename: req.file.filename,
    size: req.file.size
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다' });
    }
  }
  next(err);
});
```

### 체크리스트
- [ ] 파일 확장자 화이트리스트 검증
- [ ] MIME 타입 검증
- [ ] 파일 크기 제한
- [ ] 업로드된 파일 스캔 (바이러스 등)
- [ ] 파일명 무작위화

---

## 9. 민감 정보 보호

### 환경 변수 사용

```javascript
// .env 파일
PORT=3000
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=secretpassword
JWT_SECRET=verysecretkey
API_KEY=yourapikey

// .gitignore에 추가
.env
.env.local
.env.production
```

```javascript
// app.js
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

const jwtSecret = process.env.JWT_SECRET;
```

### 비밀번호 해싱

```javascript
const bcrypt = require('bcrypt');

// 회원가입 시
async function createUser(email, password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await User.create({
    email,
    password: hashedPassword
  });
}

// 로그인 시
async function verifyUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) return false;

  return await bcrypt.compare(password, user.password);
}
```

### 체크리스트
- [ ] .env 파일 사용 및 .gitignore 추가
- [ ] 비밀번호 해싱 (bcrypt, Argon2)
- [ ] API 키 환경 변수 저장
- [ ] 로그에 민감 정보 기록 금지

---

## 10. 보안 로깅 및 모니터링

### Winston을 사용한 로깅

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'security.log', level: 'warn' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 보안 이벤트 로깅
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  logger.info({
    event: 'login_attempt',
    email,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date()
  });

  const user = await authenticateUser(email, password);

  if (!user) {
    logger.warn({
      event: 'login_failed',
      email,
      ip: req.ip,
      timestamp: new Date()
    });
    return res.status(401).json({ error: '잘못된 인증 정보' });
  }

  logger.info({
    event: 'login_success',
    userId: user.id,
    email,
    ip: req.ip,
    timestamp: new Date()
  });

  res.json({ success: true });
});
```

### 체크리스트
- [ ] 모든 인증 시도 로깅
- [ ] 실패한 로그인 모니터링
- [ ] 비정상적인 활동 알림
- [ ] 민감 정보 로깅 금지

---

## 배포 전 최종 체크리스트

### 인프라
- [ ] HTTPS 설정 및 강제
- [ ] 방화벽 설정
- [ ] 최신 보안 패치 적용

### 애플리케이션
- [ ] 모든 보안 헤더 설정
- [ ] 인증/인가 구현
- [ ] 입력 검증 및 sanitization
- [ ] CSRF 방어
- [ ] SQL Injection 방어
- [ ] XSS 방어
- [ ] Rate Limiting

### 모니터링
- [ ] 로깅 시스템 구축
- [ ] 보안 모니터링 설정
- [ ] 알림 시스템 구축

### 정기 점검
- [ ] 의존성 업데이트
- [ ] 보안 스캔 실시
- [ ] 코드 리뷰

---

## VibeScan으로 자동 보안 점검

이 모든 체크리스트를 수동으로 확인하는 것은 시간이 많이 걸립니다. [VibeScan](https://vibescan.co.kr)을 사용하면 12,000+ 보안 취약점을 5분 안에 자동으로 검사할 수 있습니다.

### VibeScan의 장점
- ✅ 전체 체크리스트 자동 검증
- ✅ OWASP Top 10 전체 스캔
- ✅ AI 기반 우선순위 분석
- ✅ 즉시 적용 가능한 수정 방법 제공

**[지금 무료로 시작하기](https://vibescan.co.kr)**

---

## 결론

웹 보안은 한 번에 완성되는 것이 아니라 지속적인 노력이 필요합니다. 이 체크리스트를 배포 전마다 확인하고, VibeScan과 같은 자동화 도구를 활용하여 안전한 웹 애플리케이션을 유지하세요.

보안은 선택이 아닌 필수입니다!
