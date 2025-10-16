import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VulnerabilityAnalysisRequest {
  vulnerabilities: any[];
  scanType?: string;
  targetUrl?: string;
}

export interface VulnerabilityFixGuide {
  vulnerability: string;
  severity: string;
  description: string;
  impact: string;
  remediation: {
    steps: string[];
    code?: string;
    references: string[];
  };
  priority: number;
}

@Injectable()
export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. AI features will be disabled.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * AI 기반 취약점 분석 및 우선순위 지정
   */
  async analyzeVulnerabilities(
    request: VulnerabilityAnalysisRequest,
  ): Promise<{
    summary: string;
    prioritizedVulnerabilities: VulnerabilityFixGuide[];
    overallRisk: string;
    recommendations: string[];
  }> {
    if (!this.model) {
      throw new Error('Gemini AI is not initialized');
    }

    const { vulnerabilities, scanType, targetUrl } = request;

    const prompt = `
You are a cybersecurity expert analyzing vulnerabilities from a security scan.

Scan Type: ${scanType || 'General Security Scan'}
Target: ${targetUrl || 'Application'}

Vulnerabilities Found:
${JSON.stringify(vulnerabilities, null, 2)}

Please provide:
1. A brief executive summary (2-3 sentences) of the overall security posture
2. Prioritize the vulnerabilities by business impact (not just severity)
3. For each high-priority vulnerability, provide:
   - Clear description
   - Business impact
   - Step-by-step remediation guide
   - Code examples if applicable
   - Priority score (1-10, 10 being most critical)
4. Overall risk assessment (Low, Medium, High, Critical)
5. Top 5 actionable recommendations

Format your response as valid JSON with this structure:
{
  "summary": "executive summary here",
  "overallRisk": "Low|Medium|High|Critical",
  "prioritizedVulnerabilities": [
    {
      "vulnerability": "vulnerability name",
      "severity": "severity level",
      "description": "clear description",
      "impact": "business impact",
      "remediation": {
        "steps": ["step 1", "step 2", ...],
        "code": "code example if applicable",
        "references": ["reference url 1", ...]
      },
      "priority": 8
    }
  ],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from markdown code blocks if present
      let jsonText = text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const analysis = JSON.parse(jsonText);
      return analysis;
    } catch (error) {
      console.error('Gemini AI analysis error:', error);
      throw new Error('Failed to analyze vulnerabilities with AI');
    }
  }

  /**
   * 특정 취약점에 대한 상세 수정 가이드 생성
   */
  async generateFixGuide(vulnerability: {
    name: string;
    description: string;
    severity: string;
    affected?: string;
  }): Promise<{
    explanation: string;
    steps: string[];
    codeExample?: string;
    references: string[];
  }> {
    if (!this.model) {
      throw new Error('Gemini AI is not initialized');
    }

    const prompt = `
You are a senior developer providing a fix guide for a security vulnerability.

Vulnerability: ${vulnerability.name}
Severity: ${vulnerability.severity}
Description: ${vulnerability.description}
Affected Component: ${vulnerability.affected || 'Unknown'}

Please provide:
1. A clear explanation of why this is a vulnerability
2. Step-by-step remediation instructions
3. Code example showing how to fix it (if applicable)
4. References to documentation or best practices

Format your response as valid JSON:
{
  "explanation": "detailed explanation",
  "steps": ["step 1", "step 2", ...],
  "codeExample": "code example if applicable",
  "references": ["url1", "url2", ...]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let jsonText = text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Gemini AI fix guide error:', error);
      throw new Error('Failed to generate fix guide with AI');
    }
  }

  /**
   * 보안 점수 및 요약 생성
   */
  async generateSecurityScore(vulnerabilities: any[]): Promise<{
    score: number;
    grade: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  }> {
    if (!this.model) {
      throw new Error('Gemini AI is not initialized');
    }

    const prompt = `
Analyze these security vulnerabilities and generate a security score:

${JSON.stringify(vulnerabilities, null, 2)}

Provide a security score (0-100), grade (A-F), summary, strengths, and weaknesses.

Format as JSON:
{
  "score": 85,
  "grade": "B",
  "summary": "brief summary",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let jsonText = text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Gemini AI score generation error:', error);
      // Fallback to simple calculation
      return this.calculateSimpleScore(vulnerabilities);
    }
  }

  /**
   * Fallback: 간단한 점수 계산
   */
  private calculateSimpleScore(vulnerabilities: any[]): {
    score: number;
    grade: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
  } {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    vulnerabilities.forEach((vuln) => {
      const severity = (vuln.severity || 'info').toLowerCase();
      if (severityCounts.hasOwnProperty(severity)) {
        severityCounts[severity]++;
      }
    });

    // Calculate score (100 - weighted deductions)
    let score = 100;
    score -= severityCounts.critical * 20;
    score -= severityCounts.high * 10;
    score -= severityCounts.medium * 5;
    score -= severityCounts.low * 2;
    score = Math.max(0, score);

    // Determine grade
    let grade = 'A';
    if (score < 60) grade = 'F';
    else if (score < 70) grade = 'D';
    else if (score < 80) grade = 'C';
    else if (score < 90) grade = 'B';

    return {
      score,
      grade,
      summary: `발견된 총 ${vulnerabilities.length}개의 취약점 중 Critical ${severityCounts.critical}개, High ${severityCounts.high}개를 우선적으로 해결해야 합니다.`,
      strengths:
        vulnerabilities.length === 0
          ? ['취약점이 발견되지 않았습니다']
          : ['기본 보안 스캔 완료'],
      weaknesses:
        severityCounts.critical > 0 || severityCounts.high > 0
          ? ['치명적인 취약점 발견', '즉시 조치가 필요합니다']
          : [],
    };
  }

  /**
   * 자연어로 취약점 설명 생성
   */
  async explainVulnerability(vulnerabilityName: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not initialized');
    }

    const prompt = `
Explain the "${vulnerabilityName}" security vulnerability in simple terms that a junior developer can understand.
Include:
1. What it is
2. Why it's dangerous
3. A real-world example

Keep it concise (3-4 sentences).
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini AI explanation error:', error);
      return `${vulnerabilityName}은(는) 보안 취약점입니다. 자세한 정보는 OWASP 또는 CVE 데이터베이스를 참조하세요.`;
    }
  }
}
