import { Injectable } from '@nestjs/common';
import { BaseScannerService, ScanResult } from './base-scanner.service';
import * as net from 'net';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

interface PortInfo {
  port: number;
  service: string;
  description: string;
  category: string;
  risk: 'critical' | 'high' | 'medium' | 'low' | 'info';
  recommendation: string;
  cve?: string[]; // Known CVEs associated with this service
}

interface OpenPort extends PortInfo {
  state: 'open' | 'closed' | 'filtered';
  banner?: string;
  version?: string;
  responseTime?: number;
}

@Injectable()
export class PortScannerService extends BaseScannerService {
  // Comprehensive port database with security context
  private readonly PORTS_DATABASE: PortInfo[] = [
    // === CRITICAL RISK PORTS (Should never be exposed) ===
    { port: 23, service: 'Telnet', description: 'Unencrypted remote access - EXTREMELY DANGEROUS', category: 'remote', risk: 'critical', recommendation: 'CLOSE IMMEDIATELY. Use SSH (22) instead. Telnet transmits passwords in plaintext.', cve: ['CVE-2020-10188'] },
    { port: 2375, service: 'Docker API', description: 'Docker daemon API without TLS - Full container control', category: 'container', risk: 'critical', recommendation: 'CLOSE IMMEDIATELY or enable TLS (port 2376). Allows arbitrary container execution.', cve: ['CVE-2019-13509'] },
    { port: 5984, service: 'CouchDB', description: 'CouchDB database with default config vulnerabilities', category: 'database', risk: 'critical', recommendation: 'Restrict access. Enable authentication. Update to latest version.', cve: ['CVE-2017-12635', 'CVE-2017-12636'] },
    { port: 9200, service: 'Elasticsearch', description: 'Elasticsearch REST API - Often misconfigured', category: 'database', risk: 'critical', recommendation: 'Enable authentication (X-Pack). Bind to localhost only. Use firewall.', cve: ['CVE-2021-22145', 'CVE-2015-1427'] },

    // === HIGH RISK PORTS (Database/Backend services) ===
    { port: 3306, service: 'MySQL', description: 'MySQL Database Server', category: 'database', risk: 'high', recommendation: 'Should only be accessible from application servers. Enable SSL. Use strong passwords.', cve: ['CVE-2023-22102'] },
    { port: 5432, service: 'PostgreSQL', description: 'PostgreSQL Database Server', category: 'database', risk: 'high', recommendation: 'Restrict to internal network. Configure pg_hba.conf properly. Use SSL connections.', cve: ['CVE-2023-39417'] },
    { port: 1433, service: 'MS SQL Server', description: 'Microsoft SQL Server', category: 'database', risk: 'high', recommendation: 'Enable Windows Authentication. Use encrypted connections. Restrict access.', cve: ['CVE-2020-0618'] },
    { port: 27017, service: 'MongoDB', description: 'MongoDB Database Server', category: 'database', risk: 'high', recommendation: 'Enable authentication. Bind to localhost. Use SSL/TLS. Never expose to internet.', cve: ['CVE-2021-20329'] },
    { port: 6379, service: 'Redis', description: 'Redis in-memory database', category: 'cache', risk: 'high', recommendation: 'Enable authentication (requirepass). Bind to localhost. Disable dangerous commands.', cve: ['CVE-2022-0543'] },
    { port: 11211, service: 'Memcached', description: 'Memcached caching server', category: 'cache', risk: 'high', recommendation: 'Bind to localhost only. Used in DDoS amplification attacks.', cve: ['CVE-2016-8704'] },
    { port: 5672, service: 'RabbitMQ', description: 'RabbitMQ message broker', category: 'messaging', risk: 'high', recommendation: 'Enable authentication. Use TLS. Restrict management interface (15672).', cve: ['CVE-2023-46118'] },
    { port: 9092, service: 'Kafka', description: 'Apache Kafka message broker', category: 'messaging', risk: 'high', recommendation: 'Enable SASL/SSL authentication. Configure ACLs properly.', cve: [] },
    { port: 9042, service: 'Cassandra', description: 'Apache Cassandra Database', category: 'database', risk: 'high', recommendation: 'Enable authentication. Use SSL. Restrict to internal network.', cve: ['CVE-2023-30601'] },
    { port: 7000, service: 'Cassandra Inter-Node', description: 'Cassandra cluster communication', category: 'database', risk: 'high', recommendation: 'Internal use only. Should never be internet-facing.', cve: [] },
    { port: 7001, service: 'Cassandra SSL Inter-Node', description: 'Cassandra encrypted cluster communication', category: 'database', risk: 'high', recommendation: 'Internal use only. Ensure proper SSL configuration.', cve: [] },

    // === MEDIUM RISK PORTS (Management/Admin interfaces) ===
    { port: 3389, service: 'RDP', description: 'Remote Desktop Protocol', category: 'remote', risk: 'medium', recommendation: 'Use VPN or restrict by IP. Enable NLA. Keep Windows updated.', cve: ['CVE-2019-0708'] },
    { port: 8080, service: 'HTTP-Proxy', description: 'HTTP Proxy or alternative web server', category: 'web', risk: 'medium', recommendation: 'Ensure proper authentication. Check for exposed admin panels.', cve: [] },
    { port: 8443, service: 'HTTPS-Alt', description: 'Alternative HTTPS port', category: 'web', risk: 'medium', recommendation: 'Verify SSL/TLS configuration. Check certificate validity.', cve: [] },
    { port: 8888, service: 'HTTP-Alt', description: 'Alternative HTTP port or Jupyter', category: 'web', risk: 'medium', recommendation: 'Often Jupyter notebooks. Ensure authentication is enabled.', cve: [] },
    { port: 9090, service: 'Prometheus', description: 'Prometheus monitoring', category: 'monitoring', risk: 'medium', recommendation: 'Restrict access. Contains sensitive metrics. Use authentication.', cve: [] },
    { port: 5601, service: 'Kibana', description: 'Kibana dashboard for Elasticsearch', category: 'monitoring', risk: 'medium', recommendation: 'Enable authentication (X-Pack). Restrict to internal network.', cve: ['CVE-2023-23629'] },
    { port: 8086, service: 'InfluxDB', description: 'InfluxDB time-series database', category: 'database', risk: 'medium', recommendation: 'Enable authentication. Use HTTPS. Restrict access.', cve: ['CVE-2019-20933'] },
    { port: 9000, service: 'SonarQube', description: 'SonarQube code quality platform', category: 'development', risk: 'medium', recommendation: 'Change default admin password. Enable authentication.', cve: [] },
    { port: 10000, service: 'Webmin', description: 'Webmin server administration', category: 'management', risk: 'medium', recommendation: 'Keep updated. Use HTTPS. Restrict access by IP.', cve: ['CVE-2019-15107'] },
    { port: 15672, service: 'RabbitMQ Management', description: 'RabbitMQ web management interface', category: 'messaging', risk: 'medium', recommendation: 'Restrict access. Change default credentials (guest/guest).', cve: [] },

    // === LOW RISK PORTS (Standard services with proper config) ===
    { port: 22, service: 'SSH', description: 'Secure Shell - Encrypted remote access', category: 'remote', risk: 'low', recommendation: 'Disable password auth. Use key-based auth. Change default port if possible.', cve: [] },
    { port: 80, service: 'HTTP', description: 'Web server (unencrypted)', category: 'web', risk: 'low', recommendation: 'Redirect to HTTPS. Implement security headers. Keep web server updated.', cve: [] },
    { port: 443, service: 'HTTPS', description: 'Secure web server (encrypted)', category: 'web', risk: 'low', recommendation: 'Use strong SSL/TLS config. Enable HSTS. Check certificate validity.', cve: [] },
    { port: 21, service: 'FTP', description: 'File Transfer Protocol (unencrypted)', category: 'file-transfer', risk: 'low', recommendation: 'Use SFTP (22) or FTPS instead. FTP transmits credentials in plaintext.', cve: [] },
    { port: 25, service: 'SMTP', description: 'Mail Transfer Agent', category: 'mail', risk: 'low', recommendation: 'Enable STARTTLS. Configure SPF/DKIM/DMARC. Prevent open relay.', cve: [] },
    { port: 587, service: 'SMTP Submission', description: 'Mail submission with authentication', category: 'mail', risk: 'low', recommendation: 'Require authentication. Use TLS encryption.', cve: [] },
    { port: 110, service: 'POP3', description: 'Post Office Protocol', category: 'mail', risk: 'low', recommendation: 'Use POP3S (995) instead for encryption.', cve: [] },
    { port: 143, service: 'IMAP', description: 'Internet Message Access Protocol', category: 'mail', risk: 'low', recommendation: 'Use IMAPS (993) instead for encryption.', cve: [] },
    { port: 465, service: 'SMTPS', description: 'SMTP over SSL/TLS', category: 'mail', risk: 'low', recommendation: 'Ensure strong SSL/TLS configuration.', cve: [] },
    { port: 993, service: 'IMAPS', description: 'IMAP over SSL/TLS', category: 'mail', risk: 'low', recommendation: 'Ensure strong SSL/TLS configuration.', cve: [] },
    { port: 995, service: 'POP3S', description: 'POP3 over SSL/TLS', category: 'mail', risk: 'low', recommendation: 'Ensure strong SSL/TLS configuration.', cve: [] },

    // === INFO PORTS (Development/Monitoring) ===
    { port: 3000, service: 'Node.js/Grafana', description: 'Node.js dev server or Grafana', category: 'web', risk: 'info', recommendation: 'If dev server, should not be exposed in production.', cve: [] },
    { port: 4000, service: 'Development', description: 'Common development server port', category: 'web', risk: 'info', recommendation: 'Should not be exposed in production environment.', cve: [] },
    { port: 5000, service: 'Flask/Development', description: 'Flask development server or other services', category: 'web', risk: 'info', recommendation: 'Development servers should not face internet.', cve: [] },
    { port: 8000, service: 'HTTP-Alt', description: 'Alternative HTTP port', category: 'web', risk: 'info', recommendation: 'Verify service and ensure proper security configuration.', cve: [] },
    { port: 8081, service: 'HTTP-Alt', description: 'Alternative HTTP port', category: 'web', risk: 'info', recommendation: 'Verify service and ensure proper security configuration.', cve: [] },
    { port: 8082, service: 'HTTP-Alt', description: 'Alternative HTTP port', category: 'web', risk: 'info', recommendation: 'Verify service and ensure proper security configuration.', cve: [] },

    // === Infrastructure Services ===
    { port: 53, service: 'DNS', description: 'Domain Name System', category: 'infrastructure', risk: 'info', recommendation: 'Restrict recursive queries. Prevent DNS amplification attacks.', cve: ['CVE-2020-1350'] },
    { port: 123, service: 'NTP', description: 'Network Time Protocol', category: 'infrastructure', risk: 'info', recommendation: 'Disable monlist command. Prevent NTP amplification attacks.', cve: ['CVE-2023-26551'] },
    { port: 161, service: 'SNMP', description: 'Simple Network Management Protocol', category: 'infrastructure', risk: 'medium', recommendation: 'Use SNMPv3 with encryption. Change default community strings.', cve: [] },
    { port: 162, service: 'SNMP Trap', description: 'SNMP trap receiver', category: 'infrastructure', risk: 'info', recommendation: 'Configure access control. Use SNMPv3.', cve: [] },

    // === Container/Orchestration ===
    { port: 2376, service: 'Docker TLS', description: 'Docker daemon API with TLS', category: 'container', risk: 'medium', recommendation: 'Verify certificate authentication. Restrict to authorized clients.', cve: [] },
    { port: 2377, service: 'Docker Swarm', description: 'Docker Swarm cluster management', category: 'container', risk: 'medium', recommendation: 'Internal use only. Ensure proper swarm token security.', cve: [] },
    { port: 6443, service: 'Kubernetes API', description: 'Kubernetes API server', category: 'container', risk: 'high', recommendation: 'Enable RBAC. Use strong authentication. Audit logging enabled.', cve: ['CVE-2023-2431'] },
    { port: 10250, service: 'Kubelet API', description: 'Kubernetes node agent', category: 'container', risk: 'high', recommendation: 'Restrict access. Enable authentication and authorization.', cve: ['CVE-2023-2727'] },

    // === Additional common services ===
    { port: 445, service: 'SMB', description: 'Server Message Block (Windows file sharing)', category: 'file-transfer', risk: 'medium', recommendation: 'Disable if not needed. Keep Windows updated. Patch EternalBlue.', cve: ['CVE-2017-0144'] },
    { port: 139, service: 'NetBIOS', description: 'NetBIOS Session Service', category: 'file-transfer', risk: 'medium', recommendation: 'Disable if not needed. Part of legacy Windows networking.', cve: [] },
    { port: 135, service: 'MS-RPC', description: 'Microsoft RPC Endpoint Mapper', category: 'infrastructure', risk: 'medium', recommendation: 'Restrict access. Part of Windows RPC infrastructure.', cve: [] },
    { port: 1521, service: 'Oracle DB', description: 'Oracle Database listener', category: 'database', risk: 'high', recommendation: 'Restrict to application servers. Enable encryption. Use strong passwords.', cve: ['CVE-2023-21962'] },
    { port: 3128, service: 'Squid Proxy', description: 'Squid HTTP proxy', category: 'web', risk: 'medium', recommendation: 'Configure access controls. Prevent open proxy abuse.', cve: [] },
    { port: 5900, service: 'VNC', description: 'Virtual Network Computing', category: 'remote', risk: 'medium', recommendation: 'Use SSH tunnel. Enable authentication. Consider alternatives.', cve: ['CVE-2019-15681'] },
    { port: 5432, service: 'PostgreSQL', description: 'PostgreSQL database', category: 'database', risk: 'high', recommendation: 'Restrict to internal network. Enable SSL. Strong authentication.', cve: [] },
  ];

  async scan(target: string): Promise<ScanResult> {
    this.logger.log(`[PORT_SCAN] Starting enhanced port scan for: ${target}`);

    try {
      // Resolve domain to IP
      const targetHost = this.extractHostname(target);
      this.logger.log(`[PORT_SCAN] Target hostname: ${targetHost}`);

      let targetIP: string;
      try {
        const resolved = await dnsLookup(targetHost);
        targetIP = resolved.address;
        this.logger.log(`[PORT_SCAN] Resolved ${targetHost} → ${targetIP}`);
      } catch (error) {
        this.logger.error(`[PORT_SCAN] DNS resolution failed: ${error.message}`);
        return {
          success: false,
          findings: [],
          error: `DNS resolution failed: ${error.message}`,
        };
      }

      const startTime = Date.now();

      // Remove duplicates and scan
      const uniquePorts = Array.from(new Set(this.PORTS_DATABASE.map(p => p.port)))
        .map(port => this.PORTS_DATABASE.find(p => p.port === port)!);

      this.logger.log(`[PORT_SCAN] Scanning ${uniquePorts.length} common ports...`);

      // Scan all ports in parallel (with concurrency limit)
      const openPorts = await this.scanPortsConcurrent(targetIP, uniquePorts, 50);

      const duration = Date.now() - startTime;
      this.logger.log(`[PORT_SCAN] Scan completed in ${Math.round(duration / 1000)}s`);
      this.logger.log(`[PORT_SCAN] Found ${openPorts.length} open ports`);

      // Log risk breakdown
      const riskCounts = openPorts.reduce((acc, port) => {
        acc[port.risk] = (acc[port.risk] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      this.logger.log(`[PORT_SCAN] Risk breakdown: ${JSON.stringify(riskCounts)}`);

      // Convert to findings format with enhanced descriptions
      const findings = openPorts.map(port => ({
        title: `Open Port: ${port.port} (${port.service})`,
        description: this.buildDetailedDescription(port),
        severity: this.mapRiskToSeverity(port.risk),
        category: 'infrastructure',
        port: port.port,
        service: port.service,
        serviceCategory: port.category,
        state: port.state,
        banner: port.banner,
        version: port.version,
        responseTime: port.responseTime,
        risk: port.risk,
        recommendation: port.recommendation,
        cve: port.cve,
        metadata: {
          port: port.port,
          service: port.service,
          description: port.description,
          risk: port.risk,
          banner: port.banner,
          version: port.version,
          responseTime: port.responseTime,
          recommendation: port.recommendation,
          knownCVEs: port.cve,
        },
      }));

      return {
        success: true,
        findings,
        jsonReport: {
          target: targetHost,
          targetIP,
          totalPortsScanned: uniquePorts.length,
          openPorts: openPorts.length,
          scanDuration: duration,
          riskBreakdown: riskCounts,
          ports: openPorts,
        },
      };
    } catch (error) {
      this.logger.error(`[PORT_SCAN] Error: ${error.message}`);
      return {
        success: false,
        findings: [],
        error: error.message,
      };
    }
  }

  /**
   * Build detailed description for port finding
   */
  private buildDetailedDescription(port: OpenPort): string {
    let desc = port.description;

    if (port.banner) {
      desc += `\n\n**Banner:** ${port.banner}`;
    }

    if (port.version) {
      desc += `\n**Version:** ${port.version}`;
    }

    desc += `\n\n**Risk Level:** ${port.risk.toUpperCase()}`;
    desc += `\n**Response Time:** ${port.responseTime}ms`;

    if (port.recommendation) {
      desc += `\n\n**Security Recommendation:**\n${port.recommendation}`;
    }

    if (port.cve && port.cve.length > 0) {
      desc += `\n\n**Known Vulnerabilities:** ${port.cve.join(', ')}`;
    }

    return desc;
  }

  /**
   * Map risk level to severity
   */
  private mapRiskToSeverity(risk: string): string {
    switch (risk) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }

  /**
   * Extract hostname from URL or domain
   */
  private extractHostname(target: string): string {
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        const url = new URL(target);
        return url.hostname;
      }
      return target;
    } catch {
      return target;
    }
  }

  /**
   * Scan ports with concurrency limit
   */
  private async scanPortsConcurrent(
    host: string,
    ports: PortInfo[],
    concurrency: number = 50
  ): Promise<OpenPort[]> {
    const results: OpenPort[] = [];

    for (let i = 0; i < ports.length; i += concurrency) {
      const chunk = ports.slice(i, i + concurrency);
      const chunkResults = await Promise.all(
        chunk.map(portInfo => this.scanPort(host, portInfo))
      );

      const openPorts = chunkResults.filter(result => result.state === 'open');
      results.push(...openPorts);

      this.logger.debug(`[PORT_SCAN] Progress: ${Math.min(i + concurrency, ports.length)}/${ports.length} ports checked, ${results.length} open`);
    }

    return results;
  }

  /**
   * Scan a single port with enhanced banner grabbing
   */
  private async scanPort(host: string, portInfo: PortInfo): Promise<OpenPort> {
    const timeout = 3000;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let banner = '';
      let version = '';

      const timeoutId = setTimeout(() => {
        socket.destroy();
        resolve({
          ...portInfo,
          state: 'filtered',
        });
      }, timeout);

      socket.on('connect', () => {
        const responseTime = Date.now() - startTime;

        // Send service-specific probes for better banner grabbing
        this.sendServiceProbe(socket, portInfo.port);

        socket.setTimeout(2000); // Wait 2 seconds for banner

        socket.on('data', (data) => {
          const response = data.toString().trim();
          banner = response.substring(0, 500); // Limit banner size

          // Extract version information
          version = this.extractVersion(banner, portInfo.service);

          socket.destroy();
          clearTimeout(timeoutId);
          resolve({
            ...portInfo,
            state: 'open',
            banner,
            version,
            responseTime,
          });
        });

        socket.on('timeout', () => {
          socket.destroy();
          clearTimeout(timeoutId);
          resolve({
            ...portInfo,
            state: 'open',
            responseTime,
          });
        });
      });

      socket.on('error', (error: any) => {
        clearTimeout(timeoutId);
        socket.destroy();

        const state = error.code === 'ECONNREFUSED' ? 'closed' : 'filtered';
        resolve({
          ...portInfo,
          state,
        });
      });

      socket.connect(portInfo.port, host);
    });
  }

  /**
   * Send service-specific probes for better identification
   */
  private sendServiceProbe(socket: net.Socket, port: number): void {
    try {
      switch (port) {
        case 80:
        case 8080:
        case 8000:
          // HTTP probe
          socket.write('HEAD / HTTP/1.0\r\n\r\n');
          break;
        case 21:
          // FTP - usually sends banner automatically
          break;
        case 22:
          // SSH - usually sends banner automatically
          break;
        case 25:
          // SMTP probe
          socket.write('EHLO scanner\r\n');
          break;
        case 3306:
          // MySQL - usually sends banner automatically
          break;
        case 5432:
          // PostgreSQL - needs startup packet (complex, skip for now)
          break;
        default:
          // Generic probe - just wait for banner
          break;
      }
    } catch (e) {
      // Ignore probe errors
    }
  }

  /**
   * Extract version from banner
   */
  private extractVersion(banner: string, service: string): string {
    if (!banner) return '';

    // Common version patterns
    const patterns = [
      /version[:\s]+([0-9]+\.[0-9]+[0-9.]*)/i,
      /v([0-9]+\.[0-9]+[0-9.]*)/i,
      /([0-9]+\.[0-9]+\.[0-9]+)/,
      new RegExp(`${service}[/\\s]+([0-9]+\\.[0-9]+[0-9.]*)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = banner.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
  }
}
