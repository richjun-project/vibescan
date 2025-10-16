import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult } from './base-scanner.service';
import * as https from 'https';
import * as http from 'http';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);
const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

interface TechStack {
  name: string;
  version?: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

@Injectable()
export class WebReconScannerService extends BaseScannerService {
  async scan(domain: string): Promise<ScanResult> {
    try {
      const findings = [];
      const hostname = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // Run reconnaissance tests
      const [
        subdomainFindings,
        techStackFindings,
        dnsFindings,
        robotsFindings,
      ] = await Promise.allSettled([
        this.enumerateSubdomains(hostname),
        this.detectTechStack(domain),
        this.analyzeDNS(hostname),
        this.analyzeRobotsTxt(domain),
      ]);

      // Collect findings
      if (subdomainFindings.status === 'fulfilled') {
        findings.push(...subdomainFindings.value);
      }
      if (techStackFindings.status === 'fulfilled') {
        findings.push(...techStackFindings.value);
      }
      if (dnsFindings.status === 'fulfilled') {
        findings.push(...dnsFindings.value);
      }
      if (robotsFindings.status === 'fulfilled') {
        findings.push(...robotsFindings.value);
      }

      return {
        success: true,
        findings,
      };
    } catch (error) {
      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }

  /**
   * Enumerate common subdomains
   */
  private async enumerateSubdomains(hostname: string): Promise<any[]> {
    const findings = [];
    const commonSubdomains = [
      'www', 'api', 'admin', 'dev', 'staging', 'test',
      'mail', 'ftp', 'vpn', 'blog', 'shop', 'portal',
      'dashboard', 'app', 'cdn', 'static', 'assets',
    ];

    const discoveredSubdomains: string[] = [];

    for (const subdomain of commonSubdomains) {
      const fullDomain = `${subdomain}.${hostname}`;
      try {
        await resolve4(fullDomain);
        discoveredSubdomains.push(fullDomain);
      } catch (e) {
        // Subdomain doesn't exist
      }
    }

    if (discoveredSubdomains.length > 0) {
      findings.push({
        title: `${discoveredSubdomains.length} Subdomains Discovered`,
        description: `Found subdomains: ${discoveredSubdomains.join(', ')}`,
        severity: 'info',
        category: 'infrastructure',
        metadata: {
          subdomains: discoveredSubdomains,
          total: discoveredSubdomains.length,
        },
      });

      // Check for potentially sensitive subdomains
      const sensitiveSubdomains = discoveredSubdomains.filter(sub =>
        sub.includes('admin') || sub.includes('dev') ||
        sub.includes('test') || sub.includes('staging')
      );

      if (sensitiveSubdomains.length > 0) {
        findings.push({
          title: 'Sensitive Subdomains Exposed',
          description: `Development/admin subdomains are publicly accessible: ${sensitiveSubdomains.join(', ')}`,
          severity: 'medium',
          category: 'infrastructure',
          metadata: {
            subdomains: sensitiveSubdomains,
          },
        });
      }
    }

    return findings;
  }

  /**
   * Detect technology stack and versions
   */
  private async detectTechStack(url: string): Promise<any[]> {
    const findings = [];
    const detectedTech: TechStack[] = [];

    try {
      const response = await this.makeRequest(url);
      const headers = response.headers;
      const body = response.body;

      // Analyze headers
      if (headers['server']) {
        detectedTech.push({
          name: headers['server'],
          category: 'Web Server',
          confidence: 'high',
        });
      }

      if (headers['x-powered-by']) {
        detectedTech.push({
          name: headers['x-powered-by'],
          category: 'Backend',
          confidence: 'high',
        });
      }

      // Detect frontend frameworks
      const frameworkPatterns = [
        { pattern: /__nuxt|nuxt\.js/i, name: 'Nuxt.js', category: 'Frontend Framework' },
        { pattern: /_next|next\.js/i, name: 'Next.js', category: 'Frontend Framework' },
        { pattern: /react/i, name: 'React', category: 'Frontend Framework' },
        { pattern: /vue/i, name: 'Vue.js', category: 'Frontend Framework' },
        { pattern: /angular/i, name: 'Angular', category: 'Frontend Framework' },
        { pattern: /wp-content|wordpress/i, name: 'WordPress', category: 'CMS' },
        { pattern: /drupal/i, name: 'Drupal', category: 'CMS' },
        { pattern: /joomla/i, name: 'Joomla', category: 'CMS' },
        { pattern: /bootstrap/i, name: 'Bootstrap', category: 'CSS Framework' },
        { pattern: /tailwind/i, name: 'Tailwind CSS', category: 'CSS Framework' },
        { pattern: /jquery/i, name: 'jQuery', category: 'JavaScript Library' },
      ];

      for (const { pattern, name, category } of frameworkPatterns) {
        if (pattern.test(body)) {
          detectedTech.push({ name, category, confidence: 'medium' });
        }
      }

      // Detect CMS from meta tags
      const metaGeneratorMatch = body.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i);
      if (metaGeneratorMatch) {
        detectedTech.push({
          name: metaGeneratorMatch[1],
          category: 'CMS',
          confidence: 'high',
        });
      }

      // Check for common CDNs
      if (headers['cf-ray']) {
        detectedTech.push({
          name: 'Cloudflare',
          category: 'CDN/WAF',
          confidence: 'high',
        });
      }

      if (headers['x-amz-cf-id']) {
        detectedTech.push({
          name: 'Amazon CloudFront',
          category: 'CDN',
          confidence: 'high',
        });
      }

      // Report findings
      if (detectedTech.length > 0) {
        findings.push({
          title: `${detectedTech.length} Technologies Detected`,
          description: `Stack: ${detectedTech.map(t => t.name).join(', ')}`,
          severity: 'info',
          category: 'infrastructure',
          metadata: {
            technologies: detectedTech,
          },
        });

        // Check for outdated or vulnerable technologies
        const outdatedTech = detectedTech.filter(tech => {
          // Detect old versions
          if (tech.name.includes('PHP/5') || tech.name.includes('PHP/4')) {
            return true;
          }
          if (tech.name.includes('Apache/2.2') || tech.name.includes('Apache/2.0')) {
            return true;
          }
          if (tech.name.includes('nginx/1.1') || tech.name.includes('nginx/1.0')) {
            return true;
          }
          return false;
        });

        if (outdatedTech.length > 0) {
          findings.push({
            title: 'Outdated Technology Detected',
            description: `Potentially outdated: ${outdatedTech.map(t => t.name).join(', ')}`,
            severity: 'medium',
            category: 'infrastructure',
            metadata: {
              technologies: outdatedTech,
            },
          });
        }
      }
    } catch (e) {
      // Failed to detect tech stack
    }

    return findings;
  }

  /**
   * Analyze DNS records for security misconfigurations
   */
  private async analyzeDNS(hostname: string): Promise<any[]> {
    const findings = [];

    try {
      // Check SPF record
      try {
        const txtRecords = await resolveTxt(hostname);
        const spfRecord = txtRecords.find(record =>
          record.join('').includes('v=spf1')
        );

        if (!spfRecord) {
          findings.push({
            title: 'Missing SPF Record',
            description: 'No SPF record found. Email spoofing is possible.',
            severity: 'medium',
            category: 'infrastructure',
            metadata: { recordType: 'SPF' },
          });
        } else {
          const spfString = spfRecord.join('');
          // Check for permissive SPF
          if (spfString.includes('~all') || spfString.includes('+all')) {
            findings.push({
              title: 'Permissive SPF Record',
              description: 'SPF record allows any server to send emails (~all or +all)',
              severity: 'low',
              category: 'infrastructure',
              metadata: { spf: spfString },
            });
          }
        }

        // Check DMARC record
        const dmarcRecords = await resolveTxt(`_dmarc.${hostname}`).catch(() => []);
        if (dmarcRecords.length === 0) {
          findings.push({
            title: 'Missing DMARC Record',
            description: 'No DMARC record found. Email authentication is weak.',
            severity: 'low',
            category: 'infrastructure',
            metadata: { recordType: 'DMARC' },
          });
        }
      } catch (e) {
        // DNS lookup failed
      }

      // Check for CNAME records (info only)
      try {
        const cnames = await resolveCname(hostname);
        if (cnames && cnames.length > 0) {
          findings.push({
            title: 'CNAME Records Found',
            description: `Domain aliases: ${cnames.join(', ')}`,
            severity: 'info',
            category: 'infrastructure',
            metadata: { cnames },
          });
        }
      } catch (e) {
        // No CNAME
      }
    } catch (e) {
      // DNS analysis failed
    }

    return findings;
  }

  /**
   * Analyze robots.txt for exposed paths
   */
  private async analyzeRobotsTxt(url: string): Promise<any[]> {
    const findings = [];

    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const response = await this.makeRequest(robotsUrl);

      if (response.statusCode === 200) {
        const body = response.body;
        const disallowedPaths: string[] = [];

        // Parse Disallow directives
        const lines = body.split('\n');
        for (const line of lines) {
          const match = line.match(/Disallow:\s*(.+)/i);
          if (match) {
            disallowedPaths.push(match[1].trim());
          }
        }

        if (disallowedPaths.length > 0) {
          findings.push({
            title: 'robots.txt Reveals Paths',
            description: `${disallowedPaths.length} disallowed paths found in robots.txt`,
            severity: 'info',
            category: 'infrastructure',
            metadata: {
              paths: disallowedPaths.slice(0, 20), // Limit to 20 paths
              total: disallowedPaths.length,
            },
          });

          // Check for sensitive paths in robots.txt
          const sensitivePaths = disallowedPaths.filter(path =>
            path.includes('admin') || path.includes('private') ||
            path.includes('backup') || path.includes('config') ||
            path.includes('.git') || path.includes('.env')
          );

          if (sensitivePaths.length > 0) {
            findings.push({
              title: 'Sensitive Paths in robots.txt',
              description: `robots.txt reveals sensitive paths: ${sensitivePaths.join(', ')}`,
              severity: 'low',
              category: 'infrastructure',
              metadata: {
                paths: sensitivePaths,
              },
            });
          }
        }
      }
    } catch (e) {
      // robots.txt not found or error
    }

    return findings;
  }

  /**
   * Make HTTP request and return response details
   */
  private makeRequest(url: string): Promise<{
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.get(url, { timeout: 5000 }, (res) => {
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (Array.isArray(value)) {
            headers[key] = value.join(', ');
          }
        }

        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
          // Limit body size to 100KB for analysis
          if (body.length > 100000) {
            req.destroy();
            resolve({
              statusCode: res.statusCode,
              headers,
              body: body.substring(0, 100000),
            });
          }
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers,
            body,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}
