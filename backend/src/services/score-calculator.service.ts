import { Injectable } from '@nestjs/common';
import { VulnerabilitySeverity } from '../entities/vulnerability.entity';
import { ScanGrade } from '../entities/scan.entity';

export interface ScoreResult {
  totalScore: number; // 0-100
  grade: ScanGrade;
  breakdown: {
    owasp: number;
    dependency: number;
    secret: number;
    infrastructure: number;
    headers: number;
    ssl: number;
  };
  penalties: {
    severity: number;
    count: number;
  };
}

@Injectable()
export class ScoreCalculatorService {
  private readonly BASE_SCORE = 100;

  // Penalty points by severity
  private readonly SEVERITY_PENALTIES = {
    [VulnerabilitySeverity.CRITICAL]: 30,
    [VulnerabilitySeverity.HIGH]: 15,
    [VulnerabilitySeverity.MEDIUM]: 5,
    [VulnerabilitySeverity.LOW]: 1,
    [VulnerabilitySeverity.INFO]: 0,
  };

  // Category weights for breakdown
  private readonly CATEGORY_WEIGHTS = {
    owasp_top10: 30,
    dependency: 25,
    secret: 20,
    ssl_tls: 10,
    security_headers: 10,
    infrastructure: 5,
  };

  calculateScore(vulnerabilities: any[]): ScoreResult {
    let totalScore = this.BASE_SCORE;
    let totalPenalty = 0;

    const breakdown = {
      owasp: 100,
      dependency: 100,
      secret: 100,
      infrastructure: 100,
      headers: 100,
      ssl: 100,
    };

    const categoryGroups = this.groupByCategory(vulnerabilities);

    // Calculate penalties for each category
    for (const [category, vulns] of Object.entries(categoryGroups)) {
      const categoryPenalty = this.calculateCategoryPenalty(vulns);
      totalPenalty += categoryPenalty;

      // Update breakdown scores
      const categoryWeight = this.CATEGORY_WEIGHTS[category] || 5;
      const categoryScore = Math.max(
        0,
        100 - (categoryPenalty / categoryWeight) * 100,
      );

      switch (category) {
        case 'owasp_top10':
          breakdown.owasp = categoryScore;
          break;
        case 'dependency':
          breakdown.dependency = categoryScore;
          break;
        case 'secret':
          breakdown.secret = categoryScore;
          break;
        case 'ssl_tls':
          breakdown.ssl = categoryScore;
          break;
        case 'security_headers':
          breakdown.headers = categoryScore;
          break;
        case 'infrastructure':
          breakdown.infrastructure = categoryScore;
          break;
      }
    }

    // Apply total penalty
    totalScore = Math.max(0, Math.min(100, this.BASE_SCORE - totalPenalty));

    // Calculate grade
    const grade = this.calculateGrade(totalScore);

    return {
      totalScore: Math.round(totalScore),
      grade,
      breakdown,
      penalties: {
        severity: totalPenalty,
        count: vulnerabilities.length,
      },
    };
  }

  private groupByCategory(vulnerabilities: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const vuln of vulnerabilities) {
      const category = vuln.category || 'infrastructure';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(vuln);
    }

    return groups;
  }

  private calculateCategoryPenalty(vulnerabilities: any[]): number {
    let penalty = 0;

    for (const vuln of vulnerabilities) {
      const severity = vuln.severity as VulnerabilitySeverity;
      penalty += this.SEVERITY_PENALTIES[severity] || 0;
    }

    return penalty;
  }

  private calculateGrade(score: number): ScanGrade {
    if (score >= 90) return ScanGrade.A;
    if (score >= 75) return ScanGrade.B;
    if (score >= 50) return ScanGrade.C;
    return ScanGrade.D;
  }

  getGradeColor(grade: ScanGrade): string {
    const colors = {
      [ScanGrade.A]: '#10b981', // green
      [ScanGrade.B]: '#3b82f6', // blue
      [ScanGrade.C]: '#f59e0b', // yellow
      [ScanGrade.D]: '#ef4444', // red
    };

    return colors[grade];
  }

  getGradeLabel(grade: ScanGrade): string {
    const labels = {
      [ScanGrade.A]: 'Strong Vibe',
      [ScanGrade.B]: 'Solid',
      [ScanGrade.C]: 'Needs Fix',
      [ScanGrade.D]: 'Critical',
    };

    return labels[grade];
  }

  getScoreRecommendations(score: number, vulnerabilities: any[]): string[] {
    const recommendations: string[] = [];

    if (score < 90) {
      const criticalVulns = vulnerabilities.filter(
        v => v.severity === VulnerabilitySeverity.CRITICAL,
      );
      const highVulns = vulnerabilities.filter(
        v => v.severity === VulnerabilitySeverity.HIGH,
      );

      if (criticalVulns.length > 0) {
        recommendations.push(
          `즉시 수정 필요: ${criticalVulns.length}개의 심각한 취약점 발견`,
        );
      }

      if (highVulns.length > 0) {
        recommendations.push(
          `${highVulns.length}개의 높은 위험도 취약점을 우선적으로 해결하세요`,
        );
      }

      const categoryGroups = this.groupByCategory(vulnerabilities);

      if (categoryGroups.secret && categoryGroups.secret.length > 0) {
        recommendations.push(
          '노출된 시크릿이 발견되었습니다. 즉시 키를 교체하고 환경변수로 관리하세요',
        );
      }

      if (categoryGroups.owasp_top10 && categoryGroups.owasp_top10.length > 0) {
        recommendations.push(
          'OWASP Top 10 취약점이 발견되었습니다. 입력 검증 및 보안 코딩 가이드를 따르세요',
        );
      }

      if (categoryGroups.security_headers && categoryGroups.security_headers.length > 0) {
        recommendations.push(
          '보안 헤더를 추가하여 브라우저 레벨 보호를 강화하세요',
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('훌륭합니다! 보안 수준이 우수합니다.');
    }

    return recommendations;
  }
}
