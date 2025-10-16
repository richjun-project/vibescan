"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.ScoreCalculatorService = void 0;
var common_1 = require("@nestjs/common");
var vulnerability_entity_1 = require("../entities/vulnerability.entity");
var scan_entity_1 = require("../entities/scan.entity");
var ScoreCalculatorService = /** @class */ (function () {
    function ScoreCalculatorService() {
        var _a;
        this.BASE_SCORE = 100;
        // Penalty points by severity
        this.SEVERITY_PENALTIES = (_a = {},
            _a[vulnerability_entity_1.VulnerabilitySeverity.CRITICAL] = 30,
            _a[vulnerability_entity_1.VulnerabilitySeverity.HIGH] = 15,
            _a[vulnerability_entity_1.VulnerabilitySeverity.MEDIUM] = 5,
            _a[vulnerability_entity_1.VulnerabilitySeverity.LOW] = 1,
            _a[vulnerability_entity_1.VulnerabilitySeverity.INFO] = 0,
            _a);
        // Category weights for breakdown
        this.CATEGORY_WEIGHTS = {
            owasp_top10: 30,
            dependency: 25,
            secret: 20,
            ssl_tls: 10,
            security_headers: 10,
            infrastructure: 5
        };
    }
    ScoreCalculatorService.prototype.calculateScore = function (vulnerabilities) {
        var totalScore = this.BASE_SCORE;
        var totalPenalty = 0;
        var breakdown = {
            owasp: 100,
            dependency: 100,
            secret: 100,
            infrastructure: 100,
            headers: 100,
            ssl: 100
        };
        var categoryGroups = this.groupByCategory(vulnerabilities);
        // Calculate penalties for each category
        for (var _i = 0, _a = Object.entries(categoryGroups); _i < _a.length; _i++) {
            var _b = _a[_i], category = _b[0], vulns = _b[1];
            var categoryPenalty = this.calculateCategoryPenalty(vulns);
            totalPenalty += categoryPenalty;
            // Update breakdown scores
            var categoryWeight = this.CATEGORY_WEIGHTS[category] || 5;
            var categoryScore = Math.max(0, 100 - (categoryPenalty / categoryWeight) * 100);
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
        var grade = this.calculateGrade(totalScore);
        return {
            totalScore: Math.round(totalScore),
            grade: grade,
            breakdown: breakdown,
            penalties: {
                severity: totalPenalty,
                count: vulnerabilities.length
            }
        };
    };
    ScoreCalculatorService.prototype.groupByCategory = function (vulnerabilities) {
        var groups = {};
        for (var _i = 0, vulnerabilities_1 = vulnerabilities; _i < vulnerabilities_1.length; _i++) {
            var vuln = vulnerabilities_1[_i];
            var category = vuln.category || 'infrastructure';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(vuln);
        }
        return groups;
    };
    ScoreCalculatorService.prototype.calculateCategoryPenalty = function (vulnerabilities) {
        var penalty = 0;
        for (var _i = 0, vulnerabilities_2 = vulnerabilities; _i < vulnerabilities_2.length; _i++) {
            var vuln = vulnerabilities_2[_i];
            var severity = vuln.severity;
            penalty += this.SEVERITY_PENALTIES[severity] || 0;
        }
        return penalty;
    };
    ScoreCalculatorService.prototype.calculateGrade = function (score) {
        if (score >= 90)
            return scan_entity_1.ScanGrade.A;
        if (score >= 75)
            return scan_entity_1.ScanGrade.B;
        if (score >= 50)
            return scan_entity_1.ScanGrade.C;
        return scan_entity_1.ScanGrade.D;
    };
    ScoreCalculatorService.prototype.getGradeColor = function (grade) {
        var _a;
        var colors = (_a = {},
            _a[scan_entity_1.ScanGrade.A] = '#10b981',
            _a[scan_entity_1.ScanGrade.B] = '#3b82f6',
            _a[scan_entity_1.ScanGrade.C] = '#f59e0b',
            _a[scan_entity_1.ScanGrade.D] = '#ef4444',
            _a);
        return colors[grade];
    };
    ScoreCalculatorService.prototype.getGradeLabel = function (grade) {
        var _a;
        var labels = (_a = {},
            _a[scan_entity_1.ScanGrade.A] = 'Strong Vibe',
            _a[scan_entity_1.ScanGrade.B] = 'Solid',
            _a[scan_entity_1.ScanGrade.C] = 'Needs Fix',
            _a[scan_entity_1.ScanGrade.D] = 'Critical',
            _a);
        return labels[grade];
    };
    ScoreCalculatorService.prototype.getScoreRecommendations = function (score, vulnerabilities) {
        var recommendations = [];
        if (score < 90) {
            var criticalVulns = vulnerabilities.filter(function (v) { return v.severity === vulnerability_entity_1.VulnerabilitySeverity.CRITICAL; });
            var highVulns = vulnerabilities.filter(function (v) { return v.severity === vulnerability_entity_1.VulnerabilitySeverity.HIGH; });
            if (criticalVulns.length > 0) {
                recommendations.push("\uC989\uC2DC \uC218\uC815 \uD544\uC694: ".concat(criticalVulns.length, "\uAC1C\uC758 \uC2EC\uAC01\uD55C \uCDE8\uC57D\uC810 \uBC1C\uACAC"));
            }
            if (highVulns.length > 0) {
                recommendations.push("".concat(highVulns.length, "\uAC1C\uC758 \uB192\uC740 \uC704\uD5D8\uB3C4 \uCDE8\uC57D\uC810\uC744 \uC6B0\uC120\uC801\uC73C\uB85C \uD574\uACB0\uD558\uC138\uC694"));
            }
            var categoryGroups = this.groupByCategory(vulnerabilities);
            if (categoryGroups.secret && categoryGroups.secret.length > 0) {
                recommendations.push('노출된 시크릿이 발견되었습니다. 즉시 키를 교체하고 환경변수로 관리하세요');
            }
            if (categoryGroups.owasp_top10 && categoryGroups.owasp_top10.length > 0) {
                recommendations.push('OWASP Top 10 취약점이 발견되었습니다. 입력 검증 및 보안 코딩 가이드를 따르세요');
            }
            if (categoryGroups.security_headers && categoryGroups.security_headers.length > 0) {
                recommendations.push('보안 헤더를 추가하여 브라우저 레벨 보호를 강화하세요');
            }
        }
        if (recommendations.length === 0) {
            recommendations.push('훌륭합니다! 보안 수준이 우수합니다.');
        }
        return recommendations;
    };
    ScoreCalculatorService = __decorate([
        (0, common_1.Injectable)()
    ], ScoreCalculatorService);
    return ScoreCalculatorService;
}());
exports.ScoreCalculatorService = ScoreCalculatorService;
