"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AIService = void 0;
var common_1 = require("@nestjs/common");
var sdk_1 = require("@anthropic-ai/sdk");
var openai_1 = require("openai");
var AIService = /** @class */ (function () {
    function AIService() {
        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropic = new sdk_1["default"]({
                apiKey: process.env.ANTHROPIC_API_KEY
            });
        }
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1["default"]({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
    }
    AIService.prototype.explainVulnerability = function (vulnerability) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = this.buildVulnerabilityPrompt(vulnerability);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!this.anthropic) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.explainWithClaude(prompt)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        if (!this.openai) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.explainWithOpenAI(prompt)];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5: 
                    // No API keys configured
                    return [2 /*return*/, this.getFallbackExplanation(vulnerability)];
                    case 6:
                        error_1 = _a.sent();
                        console.error('AI explanation failed:', error_1);
                        return [2 /*return*/, this.getFallbackExplanation(vulnerability)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AIService.prototype.generateScanSummary = function (vulnerabilities, score) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, response, content, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = "\n\uB2E4\uC74C\uC740 \uBCF4\uC548 \uC2A4\uCE94 \uACB0\uACFC\uC785\uB2C8\uB2E4:\n\n\uC810\uC218: ".concat(score, "/100\n\uCD1D \uCDE8\uC57D\uC810 \uC218: ").concat(vulnerabilities.length, "\n\n\uCDE8\uC57D\uC810 \uBAA9\uB85D:\n").concat(vulnerabilities.slice(0, 10).map(function (v, i) { return "".concat(i + 1, ". [").concat(v.severity, "] ").concat(v.title); }).join('\n'), "\n\n\uC704 \uACB0\uACFC\uB97C \uBC14\uD0D5\uC73C\uB85C \uB2E4\uC74C\uC744 \uD3EC\uD568\uD55C \uAC04\uACB0\uD55C \uC694\uC57D(3-5\uBB38\uC7A5)\uC744 \uC791\uC131\uD558\uC138\uC694:\n1. \uC804\uCCB4\uC801\uC778 \uBCF4\uC548 \uC218\uC900 \uD3C9\uAC00\n2. \uAC00\uC7A5 \uC911\uC694\uD55C \uCDE8\uC57D\uC810 1-2\uAC1C\n3. \uC6B0\uC120 \uC870\uCE58 \uC0AC\uD56D\n\n\uD55C\uAD6D\uC5B4\uB85C \uC791\uC131\uD558\uC138\uC694.\n");
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        if (!this.openai) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4o-mini',
                                messages: [{ role: 'user', content: prompt }],
                                temperature: 0.7,
                                max_tokens: 500
                            })];
                    case 2:
                        response = _c.sent();
                        return [2 /*return*/, ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '요약을 생성할 수 없습니다.'];
                    case 3:
                        if (!this.anthropic) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: 'claude-3-5-sonnet-20241022',
                                max_tokens: 500,
                                messages: [{ role: 'user', content: prompt }]
                            })];
                    case 4:
                        response = _c.sent();
                        content = response.content[0];
                        return [2 /*return*/, content.type === 'text' ? content.text : '요약을 생성할 수 없습니다.'];
                    case 5: return [2 /*return*/, this.getFallbackSummary(score, vulnerabilities.length)];
                    case 6:
                        error_2 = _c.sent();
                        console.error('AI summary generation failed:', error_2);
                        return [2 /*return*/, this.getFallbackSummary(score, vulnerabilities.length)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AIService.prototype.explainWithClaude = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var response, content, text;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.anthropic.messages.create({
                            model: 'claude-3-5-sonnet-20241022',
                            max_tokens: 1500,
                            messages: [{ role: 'user', content: prompt }]
                        })];
                    case 1:
                        response = _a.sent();
                        content = response.content[0];
                        text = content.type === 'text' ? content.text : '';
                        return [2 /*return*/, this.parseAIResponse(text)];
                }
            });
        });
    };
    AIService.prototype.explainWithOpenAI = function (prompt) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var response, text;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.openai.chat.completions.create({
                            model: 'gpt-4o',
                            messages: [{ role: 'user', content: prompt }],
                            temperature: 0.7,
                            max_tokens: 1500
                        })];
                    case 1:
                        response = _c.sent();
                        text = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
                        return [2 /*return*/, this.parseAIResponse(text)];
                }
            });
        });
    };
    AIService.prototype.buildVulnerabilityPrompt = function (vulnerability) {
        return "\n\uB2F9\uC2E0\uC740 \uBCF4\uC548 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uBCF4\uC548 \uCDE8\uC57D\uC810\uC744 \uBD84\uC11D\uD558\uACE0 \uAC1C\uBC1C\uC790\uAC00 \uC774\uD574\uD558\uAE30 \uC27D\uAC8C \uC124\uBA85\uD574\uC8FC\uC138\uC694.\n\n\uCDE8\uC57D\uC810 \uC815\uBCF4:\n- \uC81C\uBAA9: ".concat(vulnerability.title, "\n- \uC124\uBA85: ").concat(vulnerability.description, "\n- \uC2EC\uAC01\uB3C4: ").concat(vulnerability.severity, "\n- \uCE74\uD14C\uACE0\uB9AC: ").concat(vulnerability.category, "\n").concat(vulnerability.cveId ? "- CVE ID: ".concat(vulnerability.cveId) : '', "\n").concat(vulnerability.file ? "- \uD30C\uC77C: ".concat(vulnerability.file) : '', "\n\n\uB2E4\uC74C \uD615\uC2DD\uC73C\uB85C \uB2F5\uBCC0\uD558\uC138\uC694:\n\n## \uC124\uBA85\n(\uCDE8\uC57D\uC810\uC774 \uBB34\uC5C7\uC778\uC9C0, \uC65C \uBC1C\uC0DD\uD588\uB294\uC9C0 \uC27D\uAC8C \uC124\uBA85)\n\n## \uC601\uD5A5\n(\uC774 \uCDE8\uC57D\uC810\uC774 \uC2E4\uC81C\uB85C \uC5B4\uB5A4 \uD53C\uD574\uB97C \uC904 \uC218 \uC788\uB294\uC9C0)\n\n## \uC218\uC815 \uBC29\uBC95\n(\uAD6C\uCCB4\uC801\uC778 \uC218\uC815 \uB2E8\uACC4\uC640 \uCF54\uB4DC \uC608\uC2DC)\n\n## \uAD8C\uC7A5\uC0AC\uD56D\n(\uCD94\uAC00\uB85C \uACE0\uB824\uD574\uC57C \uD560 \uC0AC\uD56D\uB4E4)\n\n\uD55C\uAD6D\uC5B4\uB85C \uC791\uC131\uD558\uC138\uC694.\n");
    };
    AIService.prototype.parseAIResponse = function (text) {
        // Simple parsing - can be improved with better structured output
        var sections = {
            explanation: '',
            impact: '',
            fixGuide: '',
            recommendations: []
        };
        var lines = text.split('\n');
        var currentSection = 'explanation';
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
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
            var trimmed = line.trim();
            if (trimmed) {
                if (currentSection === 'recommendations') {
                    if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                        sections.recommendations.push(trimmed.substring(1).trim());
                    }
                }
                else {
                    sections[currentSection] += trimmed + ' ';
                }
            }
        }
        return {
            explanation: sections.explanation.trim(),
            fixGuide: sections.fixGuide.trim(),
            impact: sections.impact.trim(),
            severity: 'medium',
            recommendations: sections.recommendations
        };
    };
    AIService.prototype.getFallbackExplanation = function (vulnerability) {
        return {
            explanation: vulnerability.description || '취약점이 발견되었습니다.',
            fixGuide: '보안 팀에 문의하거나 관련 문서를 참조하세요.',
            impact: '보안 위협이 존재할 수 있습니다.',
            severity: vulnerability.severity || 'medium',
            recommendations: ['보안 업데이트 적용', '보안 설정 검토']
        };
    };
    AIService.prototype.getFallbackSummary = function (score, vulnCount) {
        if (score >= 90) {
            return "\uBCF4\uC548 \uC810\uC218 ".concat(score, "\uC810\uC73C\uB85C \uC6B0\uC218\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. ").concat(vulnCount, "\uAC1C\uC758 \uCDE8\uC57D\uC810\uC774 \uBC1C\uACAC\uB418\uC5C8\uC73C\uB098 \uB300\uBD80\uBD84 \uB0AE\uC740 \uC2EC\uAC01\uB3C4\uC785\uB2C8\uB2E4. \uC815\uAE30\uC801\uC778 \uBCF4\uC548 \uC810\uAC80\uC744 \uD1B5\uD574 \uD604\uC7AC \uC218\uC900\uC744 \uC720\uC9C0\uD558\uC138\uC694.");
        }
        else if (score >= 75) {
            return "\uBCF4\uC548 \uC810\uC218 ".concat(score, "\uC810\uC73C\uB85C \uC591\uD638\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. ").concat(vulnCount, "\uAC1C\uC758 \uCDE8\uC57D\uC810\uC774 \uBC1C\uACAC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB192\uC740 \uC2EC\uAC01\uB3C4\uC758 \uCDE8\uC57D\uC810\uBD80\uD130 \uC6B0\uC120\uC801\uC73C\uB85C \uD574\uACB0\uD558\uC138\uC694.");
        }
        else if (score >= 50) {
            return "\uBCF4\uC548 \uC810\uC218 ".concat(score, "\uC810\uC73C\uB85C \uAC1C\uC120\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. ").concat(vulnCount, "\uAC1C\uC758 \uCDE8\uC57D\uC810\uC774 \uBC1C\uACAC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC2EC\uAC01\uD55C \uCDE8\uC57D\uC810\uC744 \uC989\uC2DC \uC218\uC815\uD558\uACE0 \uBCF4\uC548 \uC815\uCC45\uC744 \uAC15\uD654\uD558\uC138\uC694.");
        }
        else {
            return "\uBCF4\uC548 \uC810\uC218 ".concat(score, "\uC810\uC73C\uB85C \uC2EC\uAC01\uD55C \uC218\uC900\uC785\uB2C8\uB2E4. ").concat(vulnCount, "\uAC1C\uC758 \uCDE8\uC57D\uC810\uC774 \uBC1C\uACAC\uB418\uC5C8\uC73C\uBA70 \uC989\uAC01\uC801\uC778 \uC870\uCE58\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4. \uBCF4\uC548 \uC804\uBB38\uAC00\uC758 \uB3C4\uC6C0\uC744 \uBC1B\uB294 \uAC83\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.");
        }
    };
    AIService = __decorate([
        (0, common_1.Injectable)()
    ], AIService);
    return AIService;
}());
exports.AIService = AIService;
