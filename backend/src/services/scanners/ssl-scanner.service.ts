import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult } from './base-scanner.service';
import * as tls from 'tls';
import * as https from 'https';

@Injectable()
export class SSLScannerService extends BaseScannerService {
  async scan(domain: string): Promise<ScanResult> {
    try {
      const findings = [];
      const hostname = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // Check SSL/TLS certificate
      const certInfo = await this.checkCertificate(hostname);
      findings.push(...certInfo);

      // Check SSL/TLS protocols and ciphers
      const protocolInfo = await this.checkProtocols(hostname);
      findings.push(...protocolInfo);

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

  private checkCertificate(hostname: string): Promise<any[]> {
    return new Promise((resolve) => {
      const findings = [];

      const options = {
        host: hostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        const cert = (res.socket as any).getPeerCertificate();

        if (!cert || Object.keys(cert).length === 0) {
          findings.push({
            title: 'No SSL/TLS Certificate',
            description: 'Server does not provide an SSL/TLS certificate',
            severity: 'critical',
            category: 'ssl_tls',
          });
          resolve(findings);
          return;
        }

        // Check certificate expiration
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);

        if (now < validFrom) {
          findings.push({
            title: 'Certificate Not Yet Valid',
            description: `Certificate is not valid until ${validFrom}`,
            severity: 'critical',
            category: 'ssl_tls',
          });
        }

        if (now > validTo) {
          findings.push({
            title: 'Certificate Expired',
            description: `Certificate expired on ${validTo}`,
            severity: 'critical',
            category: 'ssl_tls',
          });
        } else {
          const daysUntilExpiry = Math.floor(
            (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (daysUntilExpiry < 30) {
            findings.push({
              title: 'Certificate Expiring Soon',
              description: `Certificate expires in ${daysUntilExpiry} days`,
              severity: 'high',
              category: 'ssl_tls',
            });
          }
        }

        // Check if certificate is self-signed
        if (cert.issuer && cert.subject) {
          const issuerCN = cert.issuer.CN;
          const subjectCN = cert.subject.CN;

          if (issuerCN === subjectCN) {
            findings.push({
              title: 'Self-Signed Certificate',
              description: 'Certificate is self-signed and not from a trusted CA',
              severity: 'high',
              category: 'ssl_tls',
            });
          }
        }

        resolve(findings);
      });

      req.on('error', (error) => {
        findings.push({
          title: 'SSL/TLS Connection Error',
          description: error.message,
          severity: 'high',
          category: 'ssl_tls',
        });
        resolve(findings);
      });

      req.end();
    });
  }

  private checkProtocols(hostname: string): Promise<any[]> {
    return new Promise((resolve) => {
      const findings = [];
      const weakProtocols = ['TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2'];

      const socket = tls.connect({
        host: hostname,
        port: 443,
        rejectUnauthorized: false,
      }, () => {
        const protocol = socket.getProtocol();

        if (weakProtocols.includes(protocol)) {
          findings.push({
            title: 'Weak SSL/TLS Protocol',
            description: `Server supports weak protocol: ${protocol}. Use TLS 1.2 or higher.`,
            severity: 'high',
            category: 'ssl_tls',
            protocol,
          });
        }

        socket.end();
        resolve(findings);
      });

      socket.on('error', () => {
        resolve(findings);
      });
    });
  }
}
