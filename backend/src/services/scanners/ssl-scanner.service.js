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
exports.SSLScannerService = void 0;
var common_1 = require("@nestjs/common");
var base_scanner_service_1 = require("./base-scanner.service");
var tls = require("tls");
var https = require("https");
var SSLScannerService = /** @class */ (function (_super) {
    __extends(SSLScannerService, _super);
    function SSLScannerService() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SSLScannerService.prototype.scan = function (domain) {
        return __awaiter(this, void 0, void 0, function () {
            var findings, hostname, certInfo, protocolInfo, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        findings = [];
                        hostname = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
                        return [4 /*yield*/, this.checkCertificate(hostname)];
                    case 1:
                        certInfo = _a.sent();
                        findings.push.apply(findings, certInfo);
                        return [4 /*yield*/, this.checkProtocols(hostname)];
                    case 2:
                        protocolInfo = _a.sent();
                        findings.push.apply(findings, protocolInfo);
                        return [2 /*return*/, {
                                success: true,
                                findings: findings
                            }];
                    case 3:
                        error_1 = _a.sent();
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
    SSLScannerService.prototype.checkCertificate = function (hostname) {
        return new Promise(function (resolve) {
            var findings = [];
            var options = {
                host: hostname,
                port: 443,
                method: 'GET',
                rejectUnauthorized: false
            };
            var req = https.request(options, function (res) {
                var cert = res.socket.getPeerCertificate();
                if (!cert || Object.keys(cert).length === 0) {
                    findings.push({
                        title: 'No SSL/TLS Certificate',
                        description: 'Server does not provide an SSL/TLS certificate',
                        severity: 'critical',
                        category: 'ssl_tls'
                    });
                    resolve(findings);
                    return;
                }
                // Check certificate expiration
                var now = new Date();
                var validFrom = new Date(cert.valid_from);
                var validTo = new Date(cert.valid_to);
                if (now < validFrom) {
                    findings.push({
                        title: 'Certificate Not Yet Valid',
                        description: "Certificate is not valid until ".concat(validFrom),
                        severity: 'critical',
                        category: 'ssl_tls'
                    });
                }
                if (now > validTo) {
                    findings.push({
                        title: 'Certificate Expired',
                        description: "Certificate expired on ".concat(validTo),
                        severity: 'critical',
                        category: 'ssl_tls'
                    });
                }
                else {
                    var daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysUntilExpiry < 30) {
                        findings.push({
                            title: 'Certificate Expiring Soon',
                            description: "Certificate expires in ".concat(daysUntilExpiry, " days"),
                            severity: 'high',
                            category: 'ssl_tls'
                        });
                    }
                }
                // Check if certificate is self-signed
                if (cert.issuer && cert.subject) {
                    var issuerCN = cert.issuer.CN;
                    var subjectCN = cert.subject.CN;
                    if (issuerCN === subjectCN) {
                        findings.push({
                            title: 'Self-Signed Certificate',
                            description: 'Certificate is self-signed and not from a trusted CA',
                            severity: 'high',
                            category: 'ssl_tls'
                        });
                    }
                }
                resolve(findings);
            });
            req.on('error', function (error) {
                findings.push({
                    title: 'SSL/TLS Connection Error',
                    description: error.message,
                    severity: 'high',
                    category: 'ssl_tls'
                });
                resolve(findings);
            });
            req.end();
        });
    };
    SSLScannerService.prototype.checkProtocols = function (hostname) {
        return new Promise(function (resolve) {
            var findings = [];
            var weakProtocols = ['TLSv1', 'TLSv1.1', 'SSLv3', 'SSLv2'];
            var socket = tls.connect({
                host: hostname,
                port: 443,
                rejectUnauthorized: false
            }, function () {
                var protocol = socket.getProtocol();
                if (weakProtocols.includes(protocol)) {
                    findings.push({
                        title: 'Weak SSL/TLS Protocol',
                        description: "Server supports weak protocol: ".concat(protocol, ". Use TLS 1.2 or higher."),
                        severity: 'high',
                        category: 'ssl_tls',
                        protocol: protocol
                    });
                }
                socket.end();
                resolve(findings);
            });
            socket.on('error', function () {
                resolve(findings);
            });
        });
    };
    SSLScannerService = __decorate([
        (0, common_1.Injectable)()
    ], SSLScannerService);
    return SSLScannerService;
}(base_scanner_service_1.BaseScannerService));
exports.SSLScannerService = SSLScannerService;
