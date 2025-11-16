---
title: "Web Security Checklist for Modern Developers"
description: "Essential security checklist to review before production deployment. Includes specific implementation methods and code examples for each item."
date: "2025-01-17"
author: "VibeScan Security Team"
tags: ["web security", "checklist", "security guide", "developers"]
image: "/blog/security-checklist.png"
---

Checking security before production deployment is essential. This guide provides a core security checklist every web developer should know.

## 1. HTTPS Usage and Forced Redirection

### Why It Matters
HTTP is unencrypted and vulnerable to Man-in-the-Middle attacks.

### Implementation

#### Forcing HTTPS in Express.js
```javascript
const express = require('express');
const app = express();

// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// Set HSTS header
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

#### Next.js Configuration
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

### Checklist
- [ ] Install SSL/TLS certificate (Let's Encrypt free)
- [ ] Auto-redirect from HTTP to HTTPS
- [ ] Set HSTS header
- [ ] Remove mixed content (prohibit HTTP resource loading)

---

## 2. Security Headers Configuration

### Essential Security Headers

#### Using Helmet.js (Recommended)
```javascript
const helmet = require('helmet');
const app = express();

app.use(helmet());

// Or individual configuration
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

#### Manual Configuration
```javascript
app.use((req, res, next) => {
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking prevention
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
});
```

### Checklist
- [ ] Content-Security-Policy configuration
- [ ] X-Frame-Options configuration
- [ ] X-Content-Type-Options configuration
- [ ] Referrer-Policy configuration
- [ ] Permissions-Policy configuration

---

## 3. Authentication and Session Management

### JWT-based Authentication (Stateless)

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // Expires in 1 hour
  );

  res.json({ token });
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Protected route
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
```

### Session-based Authentication

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
    secure: true, // HTTPS only
    httpOnly: true, // No JavaScript access
    maxAge: 3600000, // 1 hour
    sameSite: 'strict' // CSRF prevention
  }
}));
```

### Checklist
- [ ] Password hashing (bcrypt, Argon2)
- [ ] Strong session secret usage
- [ ] httpOnly, secure cookie flags set
- [ ] Session timeout configuration
- [ ] Complete session deletion on logout

---

## 4. Input Validation and Sanitization

### Using Express Validator

```javascript
const { body, validationResult } = require('express-validator');

app.post('/register',
  // Validation rules
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('username')
    .isAlphanumeric()
    .isLength({ min: 3, max: 20 })
    .trim()
    .escape(),

  async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Use safe input values
    const { email, password, username } = req.body;
    // Registration logic...
  }
);
```

### XSS Defense - Using DOMPurify

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

app.post('/comment', async (req, res) => {
  const { content } = req.body;

  // HTML sanitization
  const clean = DOMPurify.sanitize(content);

  await Comment.create({ content: clean });
  res.json({ success: true });
});
```

### Checklist
- [ ] Validate all user input
- [ ] Use whitelist approach
- [ ] Sanitize HTML input
- [ ] Validate file extension and MIME type on upload

---

## 5. CSRF Defense

### Using CSRF Token

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

const csrfProtection = csrf({ cookie: true });

// Include token when rendering form
app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

// Verify token on POST request
app.post('/submit', csrfProtection, (req, res) => {
  res.json({ success: true });
});
```

### Using SameSite Cookies

```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' // or 'lax'
});
```

### Checklist
- [ ] Implement CSRF tokens
- [ ] Set SameSite cookie attribute
- [ ] Require re-authentication for critical actions

---

## 6. Rate Limiting

### Using Express Rate Limit

```javascript
const rateLimit = require('express-rate-limit');

// General API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Strict login limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
});

app.post('/login', loginLimiter, loginHandler);

// Per-IP limit
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 accounts per IP
  skipFailedRequests: true,
});

app.post('/register', createAccountLimiter, registerHandler);
```

### Distributed Rate Limiting with Redis

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

### Checklist
- [ ] Apply Rate Limiting to API endpoints
- [ ] Strict limits on login/registration
- [ ] Implement IP-based limiting

---

## 7. SQL Injection Defense

### Using Prepared Statements

```javascript
// Wrong way ❌
const query = `SELECT * FROM users WHERE id = ${userId}`;

// Correct way ✅
const query = 'SELECT * FROM users WHERE id = ?';
const [rows] = await connection.execute(query, [userId]);
```

### Using ORM

```javascript
const { Sequelize, DataTypes } = require('sequelize');

// Sequelize automatically uses Prepared Statements
const user = await User.findOne({
  where: { email: userEmail }
});
```

### Checklist
- [ ] Use Prepared Statements for all queries
- [ ] Minimize raw queries when using ORM
- [ ] Validate input and use whitelist

---

## 8. Secure File Upload

### Secure File Upload with Multer

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${randomName}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate extension
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('File type not allowed'), false);
  }

  // Validate MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    filename: req.file.filename,
    size: req.file.size
  });
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large' });
    }
  }
  next(err);
});
```

### Checklist
- [ ] Whitelist file extension validation
- [ ] MIME type validation
- [ ] File size limitation
- [ ] Scan uploaded files (virus, etc.)
- [ ] Randomize filenames

---

## 9. Sensitive Information Protection

### Using Environment Variables

```bash
# .env file
PORT=3000
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=secretpassword
JWT_SECRET=verysecretkey
API_KEY=yourapikey

# Add to .gitignore
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

### Password Hashing

```javascript
const bcrypt = require('bcrypt');

// During registration
async function createUser(email, password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  await User.create({
    email,
    password: hashedPassword
  });
}

// During login
async function verifyUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) return false;

  return await bcrypt.compare(password, user.password);
}
```

### Checklist
- [ ] Use .env file and add to .gitignore
- [ ] Password hashing (bcrypt, Argon2)
- [ ] Store API keys in environment variables
- [ ] Don't log sensitive information

---

## 10. Security Logging and Monitoring

### Logging with Winston

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

// Log security events
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
    return res.status(401).json({ error: 'Invalid credentials' });
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

### Checklist
- [ ] Log all authentication attempts
- [ ] Monitor failed logins
- [ ] Alert on abnormal activity
- [ ] Don't log sensitive information

---

## Pre-Deployment Final Checklist

### Infrastructure
- [ ] HTTPS configuration and enforcement
- [ ] Firewall configuration
- [ ] Latest security patches applied

### Application
- [ ] All security headers set
- [ ] Authentication/authorization implemented
- [ ] Input validation and sanitization
- [ ] CSRF defense
- [ ] SQL Injection defense
- [ ] XSS defense
- [ ] Rate Limiting

### Monitoring
- [ ] Logging system established
- [ ] Security monitoring configured
- [ ] Alert system established

### Regular Maintenance
- [ ] Dependency updates
- [ ] Security scans
- [ ] Code reviews

---

## Automated Security Checks with VibeScan

Manually checking all these items is time-consuming. With [VibeScan](https://vibescan.co.kr/en), you can automatically check 12,000+ security vulnerabilities in just 5 minutes.

### VibeScan Benefits
- ✅ Automatic validation of entire checklist
- ✅ Complete OWASP Top 10 scan
- ✅ AI-powered prioritization
- ✅ Ready-to-apply fix methods

**[Start for Free Now](https://vibescan.co.kr/en)**

---

## Conclusion

Web security requires continuous effort, not a one-time achievement. Check this checklist before every deployment and use automation tools like VibeScan to maintain secure web applications.

Security is not optional—it's essential!
