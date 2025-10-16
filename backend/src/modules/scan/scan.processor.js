"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.ScanProcessor = void 0;
var bullmq_1 = require("@nestjs/bullmq");
var nestjs_1 = require("@mikro-orm/nestjs");
var scan_entity_1 = require("../../entities/scan.entity");
var vulnerability_entity_1 = require("../../entities/vulnerability.entity");
var ScanProcessor = /** @class */ (function (_super) {
    __extends(ScanProcessor, _super);
    function ScanProcessor(scanRepository, vulnerabilityRepository, nucleiScanner, headersScanner, sslScanner, simpleWebScanner, scoreCalculator, aiService, em) {
        var _this = _super.call(this) || this;
        _this.scanRepository = scanRepository;
        _this.vulnerabilityRepository = vulnerabilityRepository;
        _this.nucleiScanner = nucleiScanner;
        _this.headersScanner = headersScanner;
        _this.sslScanner = sslScanner;
        _this.simpleWebScanner = simpleWebScanner;
        _this.scoreCalculator = scoreCalculator;
        _this.aiService = aiService;
        _this.em = em;
        return _this;
    }
    ScanProcessor.prototype.process = function (job) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, scanId, domain, repositoryUrl, scan, _b, headersResult, sslResult, simpleWebResult, nucleiResult, result, e_1, allFindings, scoreResult, vulnerabilities, _i, allFindings_1, finding, vulnerability, aiExplanation, e_2, aiSummary, e_3, error_1, scan;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = job.data, scanId = _a.scanId, domain = _a.domain, repositoryUrl = _a.repositoryUrl;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 21, , 25]);
                        return [4 /*yield*/, this.scanRepository.findOneOrFail({ id: scanId })];
                    case 2:
                        scan = _c.sent();
                        scan.status = scan_entity_1.ScanStatus.RUNNING;
                        return [4 /*yield*/, this.em.flush()];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, Promise.all([
                                this.headersScanner.scan(domain)["catch"](function (e) { return ({ success: false, findings: [], error: e.message }); }),
                                this.sslScanner.scan(domain)["catch"](function (e) { return ({ success: false, findings: [], error: e.message }); }),
                                this.simpleWebScanner.scan(domain)["catch"](function (e) { return ({ success: false, findings: [], error: e.message }); }),
                            ])];
                    case 4:
                        _b = _c.sent(), headersResult = _b[0], sslResult = _b[1], simpleWebResult = _b[2];
                        nucleiResult = {
                            success: false,
                            findings: [],
                            error: 'Docker not available'
                        };
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.nucleiScanner.scan(domain)];
                    case 6:
                        result = _c.sent();
                        nucleiResult = __assign(__assign({}, result), { error: result.error || undefined });
                        return [3 /*break*/, 8];
                    case 7:
                        e_1 = _c.sent();
                        console.log('Nuclei scanner skipped (Docker may not be available):', e_1.message);
                        nucleiResult.error = e_1.message;
                        return [3 /*break*/, 8];
                    case 8:
                        allFindings = __spreadArray(__spreadArray(__spreadArray(__spreadArray([], nucleiResult.findings, true), headersResult.findings, true), sslResult.findings, true), simpleWebResult.findings, true);
                        scoreResult = this.scoreCalculator.calculateScore(allFindings);
                        vulnerabilities = [];
                        _i = 0, allFindings_1 = allFindings;
                        _c.label = 9;
                    case 9:
                        if (!(_i < allFindings_1.length)) return [3 /*break*/, 15];
                        finding = allFindings_1[_i];
                        vulnerability = this.vulnerabilityRepository.create({
                            scan: scan,
                            title: finding.title,
                            description: finding.description,
                            severity: finding.severity,
                            category: finding.category,
                            cveId: finding.cveId,
                            metadata: finding.metadata || finding
                        });
                        if (!(finding.severity === 'high' || finding.severity === 'critical')) return [3 /*break*/, 13];
                        _c.label = 10;
                    case 10:
                        _c.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, this.aiService.explainVulnerability(finding)];
                    case 11:
                        aiExplanation = _c.sent();
                        vulnerability.aiExplanation = aiExplanation.explanation;
                        vulnerability.fixGuide = aiExplanation.fixGuide;
                        return [3 /*break*/, 13];
                    case 12:
                        e_2 = _c.sent();
                        // AI explanation failed, continue without it
                        console.error('AI explanation failed:', e_2);
                        return [3 /*break*/, 13];
                    case 13:
                        vulnerabilities.push(vulnerability);
                        this.em.persist(vulnerability);
                        _c.label = 14;
                    case 14:
                        _i++;
                        return [3 /*break*/, 9];
                    case 15:
                        aiSummary = '';
                        _c.label = 16;
                    case 16:
                        _c.trys.push([16, 18, , 19]);
                        return [4 /*yield*/, this.aiService.generateScanSummary(allFindings, scoreResult.totalScore)];
                    case 17:
                        aiSummary = _c.sent();
                        return [3 /*break*/, 19];
                    case 18:
                        e_3 = _c.sent();
                        console.error('AI summary generation failed:', e_3);
                        return [3 /*break*/, 19];
                    case 19:
                        // Update scan with results
                        scan.status = scan_entity_1.ScanStatus.COMPLETED;
                        scan.score = scoreResult.totalScore;
                        scan.grade = scoreResult.grade;
                        scan.completedAt = new Date();
                        scan.results = {
                            score: scoreResult.totalScore,
                            grade: scoreResult.grade,
                            breakdown: scoreResult.breakdown,
                            penalties: scoreResult.penalties,
                            vulnerabilitiesCount: allFindings.length,
                            aiSummary: aiSummary,
                            recommendations: this.scoreCalculator.getScoreRecommendations(scoreResult.totalScore, allFindings),
                            scanners: {
                                nuclei: { success: nucleiResult.success, count: nucleiResult.findings.length },
                                headers: { success: headersResult.success, count: headersResult.findings.length },
                                ssl: { success: sslResult.success, count: sslResult.findings.length }
                            }
                        };
                        return [4 /*yield*/, this.em.flush()];
                    case 20:
                        _c.sent();
                        return [2 /*return*/, {
                                success: true,
                                scanId: scanId,
                                score: scoreResult.totalScore,
                                vulnerabilities: vulnerabilities.length
                            }];
                    case 21:
                        error_1 = _c.sent();
                        return [4 /*yield*/, this.scanRepository.findOne({ id: scanId })];
                    case 22:
                        scan = _c.sent();
                        if (!scan) return [3 /*break*/, 24];
                        scan.status = scan_entity_1.ScanStatus.FAILED;
                        scan.results = { error: error_1.message };
                        return [4 /*yield*/, this.em.flush()];
                    case 23:
                        _c.sent();
                        _c.label = 24;
                    case 24: throw error_1;
                    case 25: return [2 /*return*/];
                }
            });
        });
    };
    ScanProcessor = __decorate([
        (0, bullmq_1.Processor)('scan'),
        __param(0, (0, nestjs_1.InjectRepository)(scan_entity_1.Scan)),
        __param(1, (0, nestjs_1.InjectRepository)(vulnerability_entity_1.Vulnerability))
    ], ScanProcessor);
    return ScanProcessor;
}(bullmq_1.WorkerHost));
exports.ScanProcessor = ScanProcessor;
