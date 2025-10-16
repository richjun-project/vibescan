import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { join } from 'path';
import { Scan } from '../entities/scan.entity';
import { Vulnerability } from '../entities/vulnerability.entity';

@Injectable()
export class PDFService {
  /**
   * Generate a PDF report for a scan
   * Returns a buffer containing the PDF data
   */
  async generateScanReport(
    scan: Scan,
    vulnerabilities: Vulnerability[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Register Korean fonts
        const fontPath = join(__dirname, '..', 'assets', 'fonts');
        doc.registerFont('NanumGothic', join(fontPath, 'NanumGothic-Regular.ttf'));
        doc.registerFont('NanumGothic-Bold', join(fontPath, 'NanumGothic-Bold.ttf'));

        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc
          .fontSize(24)
          .font('NanumGothic-Bold')
          .text('VibeScan Security Report', { align: 'center' });

        doc.moveDown(0.5);

        doc
          .fontSize(12)
          .font('NanumGothic')
          .text(`Domain: ${scan.domain}`, { align: 'center' });

        doc
          .fontSize(10)
          .fillColor('#666')
          .text(
            `Generated on ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`,
            { align: 'center' },
          );

        doc.moveDown(2);

        // Score Section
        doc.fillColor('#000').fontSize(16).font('NanumGothic-Bold').text('Overall Score');
        doc.moveDown(0.5);

        doc
          .fontSize(48)
          .font('NanumGothic-Bold')
          .fillColor(this.getScoreColor(scan.score))
          .text(`${scan.score}/100`, { align: 'center' });

        if (scan.grade) {
          doc
            .fontSize(32)
            .text(`Grade: ${scan.grade}`, { align: 'center' });
        }

        doc.moveDown(1);

        // Severity Summary
        const stats = this.getSeverityStats(vulnerabilities);
        doc.fillColor('#000').fontSize(14).font('NanumGothic-Bold').text('Severity Breakdown');
        doc.moveDown(0.5);

        doc.fontSize(11).font('NanumGothic');
        doc
          .fillColor('#DC2626')
          .text(`Critical: ${stats.critical}`, { continued: true })
          .fillColor('#EA580C')
          .text(`  High: ${stats.high}`, { continued: true })
          .fillColor('#F59E0B')
          .text(`  Medium: ${stats.medium}`, { continued: true })
          .fillColor('#3B82F6')
          .text(`  Low: ${stats.low}`);

        doc.moveDown(2);

        // Vulnerabilities Section
        if (vulnerabilities.length > 0) {
          doc.addPage();
          doc.fillColor('#000').fontSize(16).font('NanumGothic-Bold').text('Vulnerabilities');
          doc.moveDown(1);

          vulnerabilities.forEach((vuln, index) => {
            // Check if we need a new page
            if (doc.y > 650) {
              doc.addPage();
            }

            // Vulnerability number and title
            doc
              .fontSize(12)
              .font('NanumGothic-Bold')
              .fillColor('#000')
              .text(`${index + 1}. ${vuln.title}`);

            // Severity badge
            doc
              .fontSize(10)
              .font('NanumGothic')
              .fillColor(this.getSeverityColor(vuln.severity))
              .text(`[${vuln.severity.toUpperCase()}]`, { continued: true })
              .fillColor('#666')
              .text(` ${vuln.category}`);

            if (vuln.cveId) {
              doc.fillColor('#666').text(`CVE: ${vuln.cveId}`);
            }

            doc.moveDown(0.5);

            // Description
            if (vuln.description) {
              doc
                .fontSize(10)
                .font('NanumGothic')
                .fillColor('#333')
                .text(vuln.description, {
                  width: 500,
                  align: 'left',
                });
            }

            doc.moveDown(0.5);

            // AI Explanation
            if (vuln.aiExplanation) {
              doc
                .fontSize(9)
                .font('NanumGothic-Bold')
                .fillColor('#2563EB')
                .text('AI Analysis:');
              doc
                .fontSize(9)
                .font('NanumGothic')
                .fillColor('#333')
                .text(vuln.aiExplanation, {
                  width: 500,
                  align: 'left',
                });
              doc.moveDown(0.3);
            }

            // Fix Guide
            if (vuln.fixGuide) {
              doc
                .fontSize(9)
                .font('NanumGothic-Bold')
                .fillColor('#16A34A')
                .text('Fix Guide:');
              doc
                .fontSize(9)
                .font('NanumGothic')
                .fillColor('#333')
                .text(vuln.fixGuide, {
                  width: 500,
                  align: 'left',
                });
              doc.moveDown(0.3);
            }

            doc.moveDown(1);

            // Separator line
            doc
              .strokeColor('#E5E7EB')
              .lineWidth(1)
              .moveTo(50, doc.y)
              .lineTo(550, doc.y)
              .stroke();

            doc.moveDown(1);
          });
        } else {
          doc
            .fontSize(12)
            .font('NanumGothic')
            .fillColor('#16A34A')
            .text('No vulnerabilities found. Your site appears to be secure!', {
              align: 'center',
            });
        }

        // Footer - Add page numbers to all pages
        const range = doc.bufferedPageRange();
        const pageCount = range.count;

        // Iterate through all pages using the actual page range
        for (let i = range.start; i < range.start + pageCount; i++) {
          doc.switchToPage(i);
          const pageNumber = i - range.start + 1; // Calculate display page number
          doc
            .fontSize(8)
            .font('NanumGothic')
            .fillColor('#999')
            .text(
              `Page ${pageNumber} of ${pageCount} | Generated by VibeScan`,
              50,
              doc.page.height - 30,
              { align: 'center' },
            );
        }

        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getSeverityStats(vulnerabilities: Vulnerability[]): {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  } {
    const stats = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };

    for (const vuln of vulnerabilities) {
      if (vuln.severity in stats) {
        stats[vuln.severity as keyof typeof stats]++;
      }
    }

    return stats;
  }

  private getScoreColor(score: number): string {
    if (score >= 90) return '#22C55E'; // Green
    if (score >= 75) return '#3B82F6'; // Blue
    if (score >= 50) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  }

  private getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#DC2626'; // Red
      case 'high':
        return '#EA580C'; // Orange
      case 'medium':
        return '#F59E0B'; // Yellow
      case 'low':
        return '#3B82F6'; // Blue
      default:
        return '#6B7280'; // Gray
    }
  }
}
