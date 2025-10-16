"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.ScanModule = void 0;
var common_1 = require("@nestjs/common");
var nestjs_1 = require("@mikro-orm/nestjs");
var bullmq_1 = require("@nestjs/bullmq");
var scan_entity_1 = require("../../entities/scan.entity");
var vulnerability_entity_1 = require("../../entities/vulnerability.entity");
var scan_service_1 = require("./scan.service");
var scan_controller_1 = require("./scan.controller");
var scan_processor_1 = require("./scan.processor");
var user_module_1 = require("../user/user.module");
// Scanner services
var nuclei_scanner_service_1 = require("../../services/scanners/nuclei-scanner.service");
var trivy_scanner_service_1 = require("../../services/scanners/trivy-scanner.service");
var gitleaks_scanner_service_1 = require("../../services/scanners/gitleaks-scanner.service");
var security_headers_scanner_service_1 = require("../../services/scanners/security-headers-scanner.service");
var ssl_scanner_service_1 = require("../../services/scanners/ssl-scanner.service");
var simple_web_scanner_service_1 = require("../../services/scanners/simple-web-scanner.service");
// Core services
var score_calculator_service_1 = require("../../services/score-calculator.service");
var ai_service_1 = require("../../services/ai.service");
var ScanModule = /** @class */ (function () {
    function ScanModule() {
    }
    ScanModule = __decorate([
        (0, common_1.Module)({
            imports: [
                nestjs_1.MikroOrmModule.forFeature([scan_entity_1.Scan, vulnerability_entity_1.Vulnerability]),
                bullmq_1.BullModule.registerQueue({
                    name: 'scan'
                }),
                user_module_1.UserModule,
            ],
            providers: [
                scan_service_1.ScanService,
                scan_processor_1.ScanProcessor,
                // Scanner services
                nuclei_scanner_service_1.NucleiScannerService,
                trivy_scanner_service_1.TrivyScannerService,
                gitleaks_scanner_service_1.GitleaksScannerService,
                security_headers_scanner_service_1.SecurityHeadersScannerService,
                ssl_scanner_service_1.SSLScannerService,
                simple_web_scanner_service_1.SimpleWebScannerService,
                // Core services
                score_calculator_service_1.ScoreCalculatorService,
                ai_service_1.AIService,
            ],
            controllers: [scan_controller_1.ScanController]
        })
    ], ScanModule);
    return ScanModule;
}());
exports.ScanModule = ScanModule;
