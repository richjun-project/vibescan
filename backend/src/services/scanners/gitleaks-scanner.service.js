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
exports.GitleaksScannerService = void 0;
var common_1 = require("@nestjs/common");
var base_scanner_service_1 = require("./base-scanner.service");
var GitleaksScannerService = /** @class */ (function (_super) {
    __extends(GitleaksScannerService, _super);
    function GitleaksScannerService() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.CONTAINER_NAME = 'vibescan-gitleaks';
        return _this;
    }
    GitleaksScannerService.prototype.scanRepository = function (repoPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Repository scanning requires volume mounting which is not supported with docker exec
                // This feature is planned for future implementation with proper volume management
                return [2 /*return*/, {
                        success: false,
                        findings: [],
                        error: 'Repository scanning requires volume mounting. Planned for future implementation.'
                    }];
            });
        });
    };
    GitleaksScannerService.prototype.scanGitUrl = function (gitUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var isRunning, stdout, findings, error_1, findings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.isContainerRunning(this.CONTAINER_NAME)];
                    case 1:
                        isRunning = _a.sent();
                        if (!isRunning) {
                            throw new Error("".concat(this.CONTAINER_NAME, " container is not running. Please start with: docker-compose up -d gitleaks"));
                        }
                        return [4 /*yield*/, this.executeInContainer(this.CONTAINER_NAME, [
                                'gitleaks',
                                'detect',
                                '--source',
                                gitUrl,
                                '--report-format',
                                'json',
                                '--report-path',
                                '/dev/stdout',
                                '--no-banner',
                            ])];
                    case 2:
                        stdout = (_a.sent()).stdout;
                        findings = this.parseGitleaksOutput(stdout);
                        return [2 /*return*/, {
                                success: true,
                                findings: findings,
                                rawOutput: stdout
                            }];
                    case 3:
                        error_1 = _a.sent();
                        // Gitleaks returns non-zero exit code when secrets are found
                        if (error_1.stdout) {
                            findings = this.parseGitleaksOutput(error_1.stdout);
                            return [2 /*return*/, {
                                    success: true,
                                    findings: findings,
                                    rawOutput: error_1.stdout
                                }];
                        }
                        return [2 /*return*/, {
                                success: false,
                                findings: [],
                                error: error_1.message
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitleaksScannerService.prototype.scan = function (target) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // If target looks like a Git URL, scan it
                if (target.includes('git') || target.includes('.git') || target.startsWith('http')) {
                    return [2 /*return*/, this.scanGitUrl(target)];
                }
                // Otherwise, try repository scan (will return error)
                return [2 /*return*/, this.scanRepository(target)];
            });
        });
    };
    GitleaksScannerService.prototype.parseGitleaksOutput = function (output) {
        var findings = [];
        try {
            var data = JSON.parse(output);
            if (Array.isArray(data)) {
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var leak = data_1[_i];
                    findings.push({
                        title: "Secret Detected: ".concat(leak.RuleID || 'Unknown'),
                        description: leak.Description || "Potential secret found in ".concat(leak.File),
                        severity: 'high',
                        category: 'secret',
                        file: leak.File,
                        line: leak.StartLine,
                        commit: leak.Commit,
                        author: leak.Author,
                        email: leak.Email,
                        date: leak.Date,
                        match: leak.Match,
                        secret: leak.Secret ? '***REDACTED***' : undefined,
                        metadata: leak
                    });
                }
            }
        }
        catch (e) {
            // Failed to parse JSON
        }
        return findings;
    };
    GitleaksScannerService = __decorate([
        (0, common_1.Injectable)()
    ], GitleaksScannerService);
    return GitleaksScannerService;
}(base_scanner_service_1.BaseScannerService));
exports.GitleaksScannerService = GitleaksScannerService;
