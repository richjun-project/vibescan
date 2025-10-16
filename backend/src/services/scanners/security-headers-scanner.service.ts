import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult } from './base-scanner.service';
import * as https from 'https';
import * as http from 'http';

interface Cookie {
  name: string;
  value: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  domain?: string;
  path?: string;
}

@Injectable()
export class SecurityHeadersScannerService extends BaseScannerService {
  private requiredHeaders = [
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Permissions-Policy',
  ];

  async scan(domain: string): Promise<ScanResult> {
    try {
      const response = await this.fetchHeadersAndCookies(domain);
      const findings = [
        ...this.analyzeHeaders(response.headers, domain),
        ...this.analyzeCSP(response.headers, domain),
        ...this.analyzeCORS(response.headers, domain),
        ...this.analyzeCookies(response.cookies, domain),
      ];

      return {
        success: true,
        findings,
        rawOutput: JSON.stringify(response, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }

  private fetchHeadersAndCookies(domain: string): Promise<{
    headers: Record<string, string>;
    cookies: Cookie[];
  }> {
    return new Promise((resolve, reject) => {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      client.get(url, { timeout: 10000 }, (res) => {
        const headers: Record<string, string> = {};
        const cookies: Cookie[] = [];

        // Extract headers
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (Array.isArray(value)) {
            headers[key] = value.join(', ');
          }
        }

        // Parse Set-Cookie headers
        const setCookieHeaders = res.headers['set-cookie'];
        if (setCookieHeaders) {
          for (const cookieStr of setCookieHeaders) {
            cookies.push(this.parseCookie(cookieStr));
          }
        }

        resolve({ headers, cookies });
      }).on('error', reject).on('timeout', () => {
        reject(new Error('Request timeout'));
      });
    });
  }

  private parseCookie(cookieStr: string): Cookie {
    const parts = cookieStr.split(';').map(p => p.trim());
    const [nameValue, ...attributes] = parts;
    const [name, value] = nameValue.split('=');

    const cookie: Cookie = {
      name,
      value,
      secure: false,
      httpOnly: false,
    };

    for (const attr of attributes) {
      const lowerAttr = attr.toLowerCase();
      if (lowerAttr === 'secure') {
        cookie.secure = true;
      } else if (lowerAttr === 'httponly') {
        cookie.httpOnly = true;
      } else if (lowerAttr.startsWith('samesite=')) {
        cookie.sameSite = attr.split('=')[1];
      } else if (lowerAttr.startsWith('domain=')) {
        cookie.domain = attr.split('=')[1];
      } else if (lowerAttr.startsWith('path=')) {
        cookie.path = attr.split('=')[1];
      }
    }

    return cookie;
  }

  private analyzeHeaders(
    headers: Record<string, string>,
    domain: string,
  ): any[] {
    const findings = [];
    const headersLowerCase: Record<string, string> = {};

    // Convert headers to lowercase for case-insensitive comparison
    for (const [key, value] of Object.entries(headers)) {
      headersLowerCase[key.toLowerCase()] = value;
    }

    // Check for missing security headers
    for (const requiredHeader of this.requiredHeaders) {
      const headerKey = requiredHeader.toLowerCase();

      if (!headersLowerCase[headerKey]) {
        findings.push({
          title: `Missing Security Header: ${requiredHeader}`,
          description: this.getHeaderDescription(requiredHeader),
          severity: this.getHeaderSeverity(requiredHeader),
          category: 'security_headers',
          header: requiredHeader,
          metadata: {
            header: requiredHeader,
            status: 'missing',
            domain,
          },
        });
      } else {
        // Header exists, check if it's properly configured
        const headerValue = headersLowerCase[headerKey];
        const issues = this.validateHeaderValue(requiredHeader, headerValue);

        if (issues.length > 0) {
          for (const issue of issues) {
            findings.push({
              title: `Weak ${requiredHeader} Configuration`,
              description: issue,
              severity: 'medium',
              category: 'security_headers',
              header: requiredHeader,
              value: headerValue,
              metadata: {
                header: requiredHeader,
                value: headerValue,
                status: 'weak',
                domain,
              },
            });
          }
        }
      }
    }

    return findings;
  }

  private getHeaderDescription(header: string): string {
    const descriptions: Record<string, string> = {
      'Strict-Transport-Security': 'HSTS header forces HTTPS connections',
      'Content-Security-Policy': 'CSP prevents XSS and injection attacks',
      'X-Content-Type-Options': 'Prevents MIME-type sniffing',
      'X-Frame-Options': 'Protects against clickjacking',
      'X-XSS-Protection': 'Enables browser XSS filter',
      'Referrer-Policy': 'Controls referrer information',
      'Permissions-Policy': 'Controls browser features and APIs',
    };

    return descriptions[header] || 'Security header not configured';
  }

  private getHeaderSeverity(header: string): string {
    const criticalHeaders = ['Content-Security-Policy', 'Strict-Transport-Security'];
    return criticalHeaders.includes(header) ? 'high' : 'medium';
  }

  private validateHeaderValue(header: string, value: string): string[] {
    const issues: string[] = [];

    switch (header) {
      case 'Strict-Transport-Security':
        if (!value.includes('max-age=')) {
          issues.push('HSTS max-age directive is missing');
        } else {
          const maxAge = parseInt(value.match(/max-age=(\d+)/)?.[1] || '0');
          if (maxAge < 31536000) {
            issues.push('HSTS max-age is less than 1 year (recommended: 31536000)');
          }
        }
        if (!value.includes('includeSubDomains')) {
          issues.push('HSTS includeSubDomains directive is missing');
        }
        break;

      case 'X-Frame-Options':
        if (!['DENY', 'SAMEORIGIN'].includes(value.toUpperCase())) {
          issues.push('X-Frame-Options should be DENY or SAMEORIGIN');
        }
        break;

      case 'X-Content-Type-Options':
        if (value.toLowerCase() !== 'nosniff') {
          issues.push('X-Content-Type-Options should be "nosniff"');
        }
        break;
    }

    return issues;
  }

  /**
   * Analyze Content Security Policy in detail
   */
  private analyzeCSP(headers: Record<string, string>, domain: string): any[] {
    const findings = [];
    const csp = headers['content-security-policy'];

    if (!csp) {
      return []; // Already handled in analyzeHeaders
    }

    // Parse CSP directives
    const directives = csp.split(';').map(d => d.trim());

    // Check for unsafe-inline in script-src
    const scriptSrc = directives.find(d => d.startsWith('script-src'));
    if (scriptSrc) {
      if (scriptSrc.includes("'unsafe-inline'")) {
        findings.push({
          title: "CSP allows 'unsafe-inline' scripts",
          description: "Content Security Policy allows inline scripts, reducing XSS protection",
          severity: 'high',
          category: 'security_headers',
          metadata: { directive: 'script-src', value: scriptSrc, domain },
        });
      }

      if (scriptSrc.includes("'unsafe-eval'")) {
        findings.push({
          title: "CSP allows 'unsafe-eval' scripts",
          description: "Content Security Policy allows eval(), reducing XSS protection",
          severity: 'high',
          category: 'security_headers',
          metadata: { directive: 'script-src', value: scriptSrc, domain },
        });
      }
    }

    // Check for unsafe-inline in style-src
    const styleSrc = directives.find(d => d.startsWith('style-src'));
    if (styleSrc && styleSrc.includes("'unsafe-inline'")) {
      findings.push({
        title: "CSP allows 'unsafe-inline' styles",
        description: "Content Security Policy allows inline styles",
        severity: 'medium',
        category: 'security_headers',
        metadata: { directive: 'style-src', value: styleSrc, domain },
      });
    }

    // Check for missing default-src
    const defaultSrc = directives.find(d => d.startsWith('default-src'));
    if (!defaultSrc) {
      findings.push({
        title: 'CSP missing default-src directive',
        description: "Content Security Policy should include 'default-src' as fallback",
        severity: 'low',
        category: 'security_headers',
        metadata: { domain },
      });
    }

    return findings;
  }

  /**
   * Analyze CORS configuration
   */
  private analyzeCORS(headers: Record<string, string>, domain: string): any[] {
    const findings = [];
    const acao = headers['access-control-allow-origin'];
    const acac = headers['access-control-allow-credentials'];

    if (!acao) {
      return []; // No CORS headers, nothing to analyze
    }

    // Critical: Wildcard with credentials
    if (acao === '*' && acac === 'true') {
      findings.push({
        title: 'Dangerous CORS Configuration',
        description: 'CORS allows any origin (*) with credentials. This is a critical security risk.',
        severity: 'critical',
        category: 'web_security',
        metadata: {
          'access-control-allow-origin': acao,
          'access-control-allow-credentials': acac,
          domain,
        },
      });
    } else if (acao === '*') {
      // Permissive but not critical
      findings.push({
        title: 'Permissive CORS Policy',
        description: 'CORS allows any origin (*). Consider restricting to specific domains.',
        severity: 'medium',
        category: 'web_security',
        metadata: {
          'access-control-allow-origin': acao,
          domain,
        },
      });
    }

    // Check for multiple origins (potential misconfiguration)
    if (acao && acao.includes(',')) {
      findings.push({
        title: 'Invalid CORS Configuration',
        description: 'Access-Control-Allow-Origin contains multiple origins (comma-separated). Only one origin is allowed.',
        severity: 'high',
        category: 'web_security',
        metadata: {
          'access-control-allow-origin': acao,
          domain,
        },
      });
    }

    return findings;
  }

  /**
   * Analyze cookie security
   */
  private analyzeCookies(cookies: Cookie[], domain: string): any[] {
    const findings = [];

    if (cookies.length === 0) {
      return []; // No cookies to analyze
    }

    const isHttps = domain.startsWith('https://');

    for (const cookie of cookies) {
      // Check Secure flag on HTTPS sites
      if (isHttps && !cookie.secure) {
        findings.push({
          title: `Cookie without Secure flag: ${cookie.name}`,
          description: `Cookie '${cookie.name}' is missing Secure flag. It can be transmitted over HTTP.`,
          severity: 'high',
          category: 'web_security',
          metadata: {
            cookie: cookie.name,
            issue: 'missing-secure-flag',
            domain,
          },
        });
      }

      // Check HttpOnly flag
      if (!cookie.httpOnly) {
        // Assume session cookies should have HttpOnly
        const isSessionCookie = cookie.name.toLowerCase().includes('session') ||
          cookie.name.toLowerCase().includes('token') ||
          cookie.name.toLowerCase().includes('auth');

        if (isSessionCookie) {
          findings.push({
            title: `Cookie without HttpOnly flag: ${cookie.name}`,
            description: `Session cookie '${cookie.name}' is missing HttpOnly flag. It's vulnerable to XSS attacks.`,
            severity: 'high',
            category: 'web_security',
            metadata: {
              cookie: cookie.name,
              issue: 'missing-httponly-flag',
              domain,
            },
          });
        } else {
          findings.push({
            title: `Cookie without HttpOnly flag: ${cookie.name}`,
            description: `Cookie '${cookie.name}' is missing HttpOnly flag.`,
            severity: 'medium',
            category: 'web_security',
            metadata: {
              cookie: cookie.name,
              issue: 'missing-httponly-flag',
              domain,
            },
          });
        }
      }

      // Check SameSite flag
      if (!cookie.sameSite) {
        findings.push({
          title: `Cookie without SameSite flag: ${cookie.name}`,
          description: `Cookie '${cookie.name}' is missing SameSite flag. It's vulnerable to CSRF attacks.`,
          severity: 'medium',
          category: 'web_security',
          metadata: {
            cookie: cookie.name,
            issue: 'missing-samesite-flag',
            domain,
          },
        });
      } else if (cookie.sameSite.toLowerCase() === 'none' && !cookie.secure) {
        findings.push({
          title: `Insecure SameSite=None cookie: ${cookie.name}`,
          description: `Cookie '${cookie.name}' has SameSite=None without Secure flag. This is invalid.`,
          severity: 'high',
          category: 'web_security',
          metadata: {
            cookie: cookie.name,
            issue: 'samesite-none-without-secure',
            domain,
          },
        });
      }
    }

    return findings;
  }
}
