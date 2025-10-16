"use strict";
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
exports.__esModule = true;
exports.RankingService = void 0;
var common_1 = require("@nestjs/common");
var nestjs_1 = require("@mikro-orm/nestjs");
var ranking_entity_1 = require("../../entities/ranking.entity");
var scan_entity_1 = require("../../entities/scan.entity");
var RankingService = /** @class */ (function () {
    function RankingService(rankingRepository, scanRepository, em) {
        this.rankingRepository = rankingRepository;
        this.scanRepository = scanRepository;
        this.em = em;
    }
    RankingService.prototype.getTopRankings = function (period, limit) {
        if (period === void 0) { period = ranking_entity_1.RankingPeriod.MONTHLY; }
        if (limit === void 0) { limit = 100; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rankingRepository.find({ period: period, isPublic: true }, { orderBy: { rank: 'ASC' }, limit: limit })];
            });
        });
    };
    RankingService.prototype.updateRankings = function (period) {
        if (period === void 0) { period = ranking_entity_1.RankingPeriod.MONTHLY; }
        return __awaiter(this, void 0, void 0, function () {
            var scans, domainScores, sortedDomains;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.scanRepository.find({ status: scan_entity_1.ScanStatus.COMPLETED, isPublic: true }, { orderBy: { score: 'DESC' } })];
                    case 1:
                        scans = _a.sent();
                        domainScores = new Map();
                        scans.forEach(function (scan) {
                            var currentScore = domainScores.get(scan.domain) || 0;
                            if (scan.score > currentScore) {
                                domainScores.set(scan.domain, scan.score);
                            }
                        });
                        sortedDomains = Array.from(domainScores.entries())
                            .sort(function (a, b) { return b[1] - a[1]; });
                        // Clear old rankings
                        return [4 /*yield*/, this.rankingRepository.nativeDelete({ period: period })];
                    case 2:
                        // Clear old rankings
                        _a.sent();
                        // Create new rankings
                        sortedDomains.forEach(function (_a, index) {
                            var domain = _a[0], score = _a[1];
                            var ranking = _this.rankingRepository.create({
                                domain: domain,
                                score: score,
                                rank: index + 1,
                                period: period,
                                isPublic: true,
                                periodStart: new Date(),
                                periodEnd: new Date()
                            });
                            _this.em.persist(ranking);
                        });
                        return [4 /*yield*/, this.em.flush()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, { updated: sortedDomains.length }];
                }
            });
        });
    };
    RankingService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, nestjs_1.InjectRepository)(ranking_entity_1.Ranking)),
        __param(1, (0, nestjs_1.InjectRepository)(scan_entity_1.Scan))
    ], RankingService);
    return RankingService;
}());
exports.RankingService = RankingService;
