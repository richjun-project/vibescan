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
exports.SecurityHeadersScannerService = void 0;
var common_1 = require("@nestjs/common");
var base_scanner_service_1 = require("./base-scanner.service");
var https = require("https");
var SecurityHeadersScannerService = /** @class */ (function (_super) {
    __extends(SecurityHeadersScannerService, _super);
    function SecurityHeadersScannerService() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.requiredHeaders = [
            'Strict-Transport-Security',
            'Content-Security-Policy',
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Referrer-Policy',
            'Permissions-Policy',
        ];
        return _this;
    }
    SecurityHeadersScannerService.prototype.scan = function (domain) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, findings, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.fetchHeaders(domain)];
                    case 1:
                        headers = _a.sent();
                        findings = this.analyzeHeaders(headers, domain);
                        return [2 /*return*/, {
                                success: true,
                                findings: findings,
                                rawOutput: JSON.stringify(headers, null, 2)
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
    SecurityHeadersScannerService.prototype.fetchHeaders = function (domain) {
        return new Promise(function (resolve, reject) {
            var url = domain.startsWith('http') ? domain : "https://".concat(domain);
            https.get(url, { timeout: 10000 }, function (res) {
                var headers = {};
                for (var _i = 0, _a = Object.entries(res.headers); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], value = _b[1];
                    if (typeof value === 'string') {
                        headers[key] = value;
                    }
                }
                resolve(headers);
            }).on('error', reject).on('timeout', function () {
                reject(new Error('Request timeout'));
            });
        });
    };
    SecurityHeadersScannerService.prototype.analyzeHeaders = function (headers, domain) {
        var findings = [];
        var headersLowerCase = {};
        // Convert headers to lowercase for case-insensitive comparison
        for (var _i = 0, _a = Object.entries(headers); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            headersLowerCase[key.toLowerCase()] = value;
        }
        // Check for missing security headers
        for (var _c = 0, _d = this.requiredHeaders; _c < _d.length; _c++) {
            var requiredHeader = _d[_c];
            var headerKey = requiredHeader.toLowerCase();
            if (!headersLowerCase[headerKey]) {
                findings.push({
                    title: "Missing Security Header: ".concat(requiredHeader),
                    description: this.getHeaderDescription(requiredHeader),
                    severity: this.getHeaderSeverity(requiredHeader),
                    category: 'security_headers',
                    header: requiredHeader,
                    metadata: {
                        header: requiredHeader,
                        status: 'missing',
                        domain: domain
                    }
                });
            }
            else {
                // Header exists, check if it's properly configured
                var headerValue = headersLowerCase[headerKey];
                var issues = this.validateHeaderValue(requiredHeader, headerValue);
                if (issues.length > 0) {
                    for (var _e = 0, issues_1 = issues; _e < issues_1.length; _e++) {
                        var issue = issues_1[_e];
                        findings.push({
                            title: "Weak ".concat(requiredHeader, " Configuration"),
                            description: issue,
                            severity: 'medium',
                            category: 'security_headers',
                            header: requiredHeader,
                            value: headerValue,
                            metadata: {
                                header: requiredHeader,
                                value: headerValue,
                                status: 'weak',
                                domain: domain
                            }
                        });
                    }
                }
            }
        }
        return findings;
    };
    SecurityHeadersScannerService.prototype.getHeaderDescription = function (header) {
        var descriptions = {
            'Strict-Transport-Security': 'HSTS header forces HTTPS connections',
            'Content-Security-Policy': 'CSP prevents XSS and injection attacks',
            'X-Content-Type-Options': 'Prevents MIME-type sniffing',
            'X-Frame-Options': 'Protects against clickjacking',
            'X-XSS-Protection': 'Enables browser XSS filter',
            'Referrer-Policy': 'Controls referrer information',
            'Permissions-Policy': 'Controls browser features and APIs'
        };
        return descriptions[header] || 'Security header not configured';
    };
    SecurityHeadersScannerService.prototype.getHeaderSeverity = function (header) {
        var criticalHeaders = ['Content-Security-Policy', 'Strict-Transport-Security'];
        return criticalHeaders.includes(header) ? 'high' : 'medium';
    };
    SecurityHeadersScannerService.prototype.validateHeaderValue = function (header, value) {
        var _a;
        var issues = [];
        switch (header) {
            case 'Strict-Transport-Security':
                if (!value.includes('max-age=')) {
                    issues.push('HSTS max-age directive is missing');
                }
                else {
                    var maxAge = parseInt(((_a = value.match(/max-age=(\d+)/)) === null || _a === void 0 ? void 0 : _a[1]) || '0');
                    if (maxAge < 31536000) {
                        issues.push('HSTS max-age is less than 1 year (recommended: 31536000)');
                    }
                }
                if (!value.includes('includeSubDomains')) {
                    issues.push('HSTS includeSubDomains directive is missing');
                }
                break;
            case 'X-Frame-Options':
                if (!['DENY', 'SAMEORIGIN'].includes(value.toUpperCase())) {
                    issues.push('X-Frame-Options should be DENY or SAMEORIGIN');
                }
                break;
            case 'X-Content-Type-Options':
                if (value.toLowerCase() !== 'nosniff') {
                    issues.push('X-Content-Type-Options should be "nosniff"');
                }
                break;
        }
        return issues;
    };
    SecurityHeadersScannerService = __decorate([
        (0, common_1.Injectable)()
    ], SecurityHeadersScannerService);
    return SecurityHeadersScannerService;
}(base_scanner_service_1.BaseScannerService));
exports.SecurityHeadersScannerService = SecurityHeadersScannerService;
