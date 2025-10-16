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
exports.SimpleWebScannerService = void 0;
var common_1 = require("@nestjs/common");
var base_scanner_service_1 = require("./base-scanner.service");
var https = require("https");
var http = require("http");
var SimpleWebScannerService = /** @class */ (function (_super) {
    __extends(SimpleWebScannerService, _super);
    function SimpleWebScannerService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SimpleWebScannerService.prototype.scan = function (domain) {
        return __awaiter(this, void 0, void 0, function () {
            var findings_1, url, tests, results, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        findings_1 = [];
                        url = domain.startsWith('http') ? domain : "https://".concat(domain);
                        tests = [
                            this.checkDirectoryListing(url),
                            this.checkServerInfo(url),
                            this.checkCommonFiles(url),
                        ];
                        return [4 /*yield*/, Promise.allSettled(tests)];
                    case 1:
                        results = _a.sent();
                        results.forEach(function (result) {
                            if (result.status === 'fulfilled' && result.value) {
                                findings_1.push.apply(findings_1, result.value);
                            }
                        });
                        return [2 /*return*/, {
                                success: true,
                                findings: findings_1
                            }];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                findings: [],
                                error: error_1.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SimpleWebScannerService.prototype.checkServerInfo = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var findings = [];
                        var urlObj = new URL(url);
                        var client = urlObj.protocol === 'https:' ? https : http;
                        var req = client.get(url, { timeout: 5000 }, function (res) {
                            // Check for server info disclosure
                            if (res.headers['server']) {
                                findings.push({
                                    title: 'Server Information Disclosure',
                                    description: "Server header reveals: ".concat(res.headers['server']),
                                    severity: 'low',
                                    category: 'infrastructure',
                                    metadata: { server: res.headers['server'] }
                                });
                            }
                            // Check for X-Powered-By
                            if (res.headers['x-powered-by']) {
                                findings.push({
                                    title: 'Technology Stack Disclosure',
                                    description: "X-Powered-By header reveals: ".concat(res.headers['x-powered-by']),
                                    severity: 'low',
                                    category: 'infrastructure',
                                    metadata: { poweredBy: res.headers['x-powered-by'] }
                                });
                            }
                            resolve(findings);
                        });
                        req.on('error', function () { return resolve(findings); });
                        req.on('timeout', function () {
                            req.destroy();
                            resolve(findings);
                        });
                    })];
            });
        });
    };
    SimpleWebScannerService.prototype.checkDirectoryListing = function (baseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var findings, testPaths, _i, testPaths_1, path, url, result, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        findings = [];
                        testPaths = ['/admin', '/backup', '/.git', '/.env'];
                        _i = 0, testPaths_1 = testPaths;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testPaths_1.length)) return [3 /*break*/, 6];
                        path = testPaths_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        url = new URL(path, baseUrl);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 3:
                        result = _a.sent();
                        if (result.statusCode === 200 || result.statusCode === 403) {
                            findings.push({
                                title: "Sensitive Path Accessible: ".concat(path),
                                description: "Found potentially sensitive path at ".concat(path, " (Status: ").concat(result.statusCode, ")"),
                                severity: result.statusCode === 200 ? 'medium' : 'low',
                                category: 'owasp_top10',
                                metadata: { path: path, statusCode: result.statusCode }
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, findings];
                }
            });
        });
    };
    SimpleWebScannerService.prototype.checkCommonFiles = function (baseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var findings, testFiles, _i, testFiles_1, file, url, result, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        findings = [];
                        testFiles = ['/robots.txt', '/sitemap.xml', '/.well-known/security.txt'];
                        _i = 0, testFiles_1 = testFiles;
                        _a.label = 1;
                    case 1:
                        if (!(_i < testFiles_1.length)) return [3 /*break*/, 6];
                        file = testFiles_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        url = new URL(file, baseUrl);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 3:
                        result = _a.sent();
                        if (result.statusCode === 200) {
                            // robots.txt and sitemap.xml are good to have
                            if (file === '/robots.txt' || file === '/sitemap.xml') {
                                // These are informational, not vulnerabilities
                                return [3 /*break*/, 5];
                            }
                            findings.push({
                                title: "File Found: ".concat(file),
                                description: "Public file accessible at ".concat(file),
                                severity: 'info',
                                category: 'infrastructure',
                                metadata: { file: file, statusCode: result.statusCode }
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, findings];
                }
            });
        });
    };
    SimpleWebScannerService.prototype.makeRequest = function (url) {
        return new Promise(function (resolve, reject) {
            var urlObj = new URL(url);
            var client = urlObj.protocol === 'https:' ? https : http;
            var req = client.get(url, { timeout: 3000 }, function (res) {
                var body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                    if (body.length > 10000) {
                        req.destroy();
                        resolve({ statusCode: res.statusCode, body: body.substring(0, 10000) });
                    }
                });
                res.on('end', function () {
                    resolve({ statusCode: res.statusCode, body: body });
                });
            });
            req.on('error', reject);
            req.on('timeout', function () {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    };
    SimpleWebScannerService = __decorate([
        (0, common_1.Injectable)()
    ], SimpleWebScannerService);
    return SimpleWebScannerService;
}(base_scanner_service_1.BaseScannerService));
exports.SimpleWebScannerService = SimpleWebScannerService;
