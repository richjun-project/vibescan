import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIExplanation {
  explanation: string;
  fixGuide: string;
  severity: string;
  impact: string;
  recommendations: string[];
}

@Injectable()
export class AIService {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private gemini: any;

  constructor() {
    // Initialize Gemini (Priority 1 - most cost-effective)
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    }

    // Initialize Claude (Priority 2)
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // Initialize OpenAI (Priority 3)
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async explainVulnerability(vulnerability: any): Promise<AIExplanation> {
    const prompt = this.buildVulnerabilityPrompt(vulnerability);

    try {
      // Try Gemini first (most cost-effective)
      if (this.gemini) {
        return await this.explainWithGemini(prompt);
      }

      // Fallback to Claude (better for detailed technical explanations)
      if (this.anthropic) {
        return await this.explainWithClaude(prompt);
      }

      // Fallback to GPT-4o
      if (this.openai) {
        return await this.explainWithOpenAI(prompt);
      }

      // No API keys configured
      return this.getFallbackExplanation(vulnerability);
    } catch (error) {
      console.error('AI explanation failed:', error);
      return this.getFallbackExplanation(vulnerability);
    }
  }

  async generateScanSummary(
    vulnerabilities: any[],
    score: number,
    language: 'ko' | 'en' = 'ko',
  ): Promise<string> {
    // Count vulnerabilities by severity
    const severityCounts = vulnerabilities.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Handle case when no vulnerabilities found
    if (vulnerabilities.length === 0) {
      return language === 'ko'
        ? '주요 취약점:\n• 발견된 취약점이 없습니다.\n\n조치 방법:\n1. 현재 보안 상태가 우수합니다. 정기적인 보안 스캔을 유지하세요.\n2. 새로운 기능 추가 시 보안 검토를 진행하세요.'
        : 'Key Vulnerabilities:\n• No vulnerabilities found.\n\nRecommended Actions:\n1. Your current security state is excellent. Maintain regular security scans.\n2. Conduct security reviews when adding new features.';
    }

    const prompt = language === 'ko' ? `
다음은 실제 보안 스캔에서 발견된 취약점 목록입니다. 오직 아래 나열된 취약점만을 기반으로 분석하세요.

점수: ${score}/100
총 취약점 수: ${vulnerabilities.length}
심각도별:
- Critical: ${severityCounts.critical || 0}
- High: ${severityCounts.high || 0}
- Medium: ${severityCounts.medium || 0}
- Low: ${severityCounts.low || 0}
- Info: ${severityCounts.info || 0}

실제 발견된 취약점:
${vulnerabilities.slice(0, 10).map((v, i) => `${i + 1}. [${v.severity}] ${v.title}${v.category ? ` (${v.category})` : ''}`).join('\n')}

위에 나열된 취약점만을 사용하여 다음 형식으로 작성하세요:

주요 취약점:
• [위 목록에서 선택한 실제 취약점 이름]
• [위 목록에서 선택한 실제 취약점 이름]
• [위 목록에서 선택한 실제 취약점 이름]

조치 방법:
1. [위에서 언급한 취약점에 대한 구체적인 수정 방법]
2. [위에서 언급한 취약점에 대한 구체적인 수정 방법]
3. [위에서 언급한 취약점에 대한 구체적인 수정 방법]

중요: 위 목록에 없는 취약점은 절대 언급하지 마세요. 한국어로 작성하고, 마크다운 볼드 표시(**텍스트**)는 사용하지 마세요.
` : `
The following is a list of vulnerabilities found in an actual security scan. Analyze based ONLY on the vulnerabilities listed below.

Score: ${score}/100
Total Vulnerabilities: ${vulnerabilities.length}
By Severity:
- Critical: ${severityCounts.critical || 0}
- High: ${severityCounts.high || 0}
- Medium: ${severityCounts.medium || 0}
- Low: ${severityCounts.low || 0}
- Info: ${severityCounts.info || 0}

Actual Vulnerabilities Found:
${vulnerabilities.slice(0, 10).map((v, i) => `${i + 1}. [${v.severity}] ${v.title}${v.category ? ` (${v.category})` : ''}`).join('\n')}

Using ONLY the vulnerabilities listed above, write in the following format:

Key Vulnerabilities:
• [Actual vulnerability name from the list above]
• [Actual vulnerability name from the list above]
• [Actual vulnerability name from the list above]

Recommended Actions:
1. [Specific fix method for the vulnerabilities mentioned above]
2. [Specific fix method for the vulnerabilities mentioned above]
3. [Specific fix method for the vulnerabilities mentioned above]

Important: Do NOT mention any vulnerabilities not in the list above. Write in English and do not use markdown bold formatting (**text**).
`;

    try {
      // Try Gemini first
      if (this.gemini) {
        const result = await this.gemini.generateContent(prompt);
        const response = await result.response;
        return response.text() || '요약을 생성할 수 없습니다.';
      }

      // Fallback to OpenAI
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 500,
        });

        return response.choices[0]?.message?.content || '요약을 생성할 수 없습니다.';
      }

      // Fallback to Claude
      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0];
        return content.type === 'text' ? content.text : '요약을 생성할 수 없습니다.';
      }

      return this.getFallbackSummary(score, vulnerabilities.length, language);
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return this.getFallbackSummary(score, vulnerabilities.length, language);
    }
  }

  private async explainWithGemini(prompt: string): Promise<AIExplanation> {
    const result = await this.gemini.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return this.parseAIResponse(text);
  }

  private async explainWithClaude(prompt: string): Promise<AIExplanation> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : '';

    return this.parseAIResponse(text);
  }

  private async explainWithOpenAI(prompt: string): Promise<AIExplanation> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const text = response.choices[0]?.message?.content || '';

    return this.parseAIResponse(text);
  }

  private buildVulnerabilityPrompt(vulnerability: any): string {
    return `
당신은 보안 전문가입니다. 다음 보안 취약점을 분석하고 개발자가 이해하기 쉽게 설명해주세요.

취약점 정보:
- 제목: ${vulnerability.title}
- 설명: ${vulnerability.description}
- 심각도: ${vulnerability.severity}
- 카테고리: ${vulnerability.category}
${vulnerability.cveId ? `- CVE ID: ${vulnerability.cveId}` : ''}
${vulnerability.file ? `- 파일: ${vulnerability.file}` : ''}

다음 형식으로 답변하세요:

## 설명
(취약점이 무엇인지, 왜 발생했는지 쉽게 설명)

## 영향
(이 취약점이 실제로 어떤 피해를 줄 수 있는지)

## 수정 방법
(구체적인 수정 단계와 코드 예시)

## 권장사항
(추가로 고려해야 할 사항들)

한국어로 작성하세요.
`;
  }

  private parseAIResponse(text: string): AIExplanation {
    // Simple parsing - can be improved with better structured output
    const sections = {
      explanation: '',
      impact: '',
      fixGuide: '',
      recommendations: [] as string[],
    };

    const lines = text.split('\n');
    let currentSection = 'explanation';

    for (const line of lines) {
      if (line.includes('## 영향') || line.includes('영향:')) {
        currentSection = 'impact';
        continue;
      }
      if (line.includes('## 수정') || line.includes('수정 방법:')) {
        currentSection = 'fixGuide';
        continue;
      }
      if (line.includes('## 권장') || line.includes('권장사항:')) {
        currentSection = 'recommendations';
        continue;
      }

      const trimmed = line.trim();
      if (trimmed) {
        if (currentSection === 'recommendations') {
          if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
            sections.recommendations.push(trimmed.substring(1).trim());
          }
        } else {
          sections[currentSection] += trimmed + ' ';
        }
      }
    }

    return {
      explanation: sections.explanation.trim(),
      fixGuide: sections.fixGuide.trim(),
      impact: sections.impact.trim(),
      severity: 'medium',
      recommendations: sections.recommendations,
    };
  }

  private getFallbackExplanation(vulnerability: any): AIExplanation {
    return {
      explanation: vulnerability.description || '취약점이 발견되었습니다.',
      fixGuide: '보안 팀에 문의하거나 관련 문서를 참조하세요.',
      impact: '보안 위협이 존재할 수 있습니다.',
      severity: vulnerability.severity || 'medium',
      recommendations: ['보안 업데이트 적용', '보안 설정 검토'],
    };
  }

  private getFallbackSummary(score: number, vulnCount: number, language: 'ko' | 'en' = 'ko'): string {
    let risks = '';
    let actions = '';

    if (language === 'ko') {
      if (score === 100) {
        risks = '주요 취약점:\n• 발견된 취약점이 없습니다.';
        actions = '조치 방법:\n1. 현재 보안 상태가 우수합니다. 정기적인 보안 스캔을 유지하세요.\n2. 새로운 기능 추가 시 보안 검토를 진행하세요.';
      } else if (score >= 90) {
        risks = '주요 취약점:\n• 낮은 심각도의 보안 헤더 누락\n• 일부 정보성 취약점';
        actions = '조치 방법:\n1. 웹서버 보안 헤더 설정 추가 (CSP, HSTS, X-Frame-Options)\n2. 정기적인 보안 스캔 스케줄 설정 (월 1회 권장)';
      } else if (score >= 75) {
        risks = '주요 취약점:\n• 보안 헤더 미설정\n• 일부 설정 오류 발견\n• 취약한 암호화 알고리즘 사용 가능성';
        actions = '조치 방법:\n1. 웹서버 설정 파일에서 보안 헤더 추가\n2. SSL/TLS 설정 강화 (TLS 1.2 이상 사용)\n3. 취약점 상세 정보 확인 후 개별 조치';
      } else if (score >= 50) {
        risks = '주요 취약점:\n• 필수 보안 헤더 다수 누락\n• SSL/TLS 설정 취약\n• 민감한 정보 노출 가능성';
        actions = '조치 방법:\n1. 즉시 HTTPS 강제 적용 (HTTP → HTTPS 리다이렉트)\n2. 모든 보안 헤더 추가 (Content-Security-Policy, HSTS, X-Content-Type-Options 등)\n3. 노출된 민감 정보 제거 (버전 정보, 디버그 메시지 등)';
      } else {
        risks = '주요 취약점:\n• 심각한 보안 설정 오류 다수\n• 중요 보안 헤더 전체 누락\n• 알려진 취약점 패턴 발견';
        actions = '조치 방법:\n1. 즉시 Critical/High 등급 취약점 상세 내용 확인\n2. 웹 방화벽(WAF) 적용 고려\n3. 전문가 보안 감사 요청\n4. 모든 보안 헤더 및 SSL/TLS 설정 재구성';
      }
    } else {
      if (score === 100) {
        risks = 'Key Vulnerabilities:\n• No vulnerabilities found.';
        actions = 'Recommended Actions:\n1. Your current security state is excellent. Maintain regular security scans.\n2. Conduct security reviews when adding new features.';
      } else if (score >= 90) {
        risks = 'Key Vulnerabilities:\n• Missing low-severity security headers\n• Some informational issues';
        actions = 'Recommended Actions:\n1. Add web server security headers (CSP, HSTS, X-Frame-Options)\n2. Set up regular security scan schedule (monthly recommended)';
      } else if (score >= 75) {
        risks = 'Key Vulnerabilities:\n• Security headers not configured\n• Some configuration errors found\n• Possible use of weak encryption algorithms';
        actions = 'Recommended Actions:\n1. Add security headers in web server configuration\n2. Strengthen SSL/TLS settings (use TLS 1.2 or higher)\n3. Review vulnerability details and address individually';
      } else if (score >= 50) {
        risks = 'Key Vulnerabilities:\n• Multiple required security headers missing\n• Weak SSL/TLS configuration\n• Possible exposure of sensitive information';
        actions = 'Recommended Actions:\n1. Immediately enforce HTTPS (HTTP → HTTPS redirect)\n2. Add all security headers (Content-Security-Policy, HSTS, X-Content-Type-Options, etc.)\n3. Remove exposed sensitive information (version info, debug messages, etc.)';
      } else {
        risks = 'Key Vulnerabilities:\n• Multiple critical security configuration errors\n• All important security headers missing\n• Known vulnerability patterns detected';
        actions = 'Recommended Actions:\n1. Immediately review Critical/High severity vulnerability details\n2. Consider implementing Web Application Firewall (WAF)\n3. Request professional security audit\n4. Reconfigure all security headers and SSL/TLS settings';
      }
    }

    return `${risks}\n\n${actions}`;
  }
}
