"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Ranking = exports.RankingPeriod = void 0;
var core_1 = require("@mikro-orm/core");
var RankingPeriod;
(function (RankingPeriod) {
    RankingPeriod["WEEKLY"] = "weekly";
    RankingPeriod["MONTHLY"] = "monthly";
    RankingPeriod["QUARTERLY"] = "quarterly";
    RankingPeriod["ALL_TIME"] = "all_time";
})(RankingPeriod = exports.RankingPeriod || (exports.RankingPeriod = {}));
var Ranking = /** @class */ (function () {
    function Ranking() {
        this.isPublic = false;
        this.updatedAt = new Date();
        this.periodStart = new Date();
        this.periodEnd = new Date();
    }
    __decorate([
        (0, core_1.PrimaryKey)()
    ], Ranking.prototype, "id");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "domain");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "score");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "rank");
    __decorate([
        (0, core_1.Enum)(function () { return RankingPeriod; })
    ], Ranking.prototype, "period");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Ranking.prototype, "industry");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "isPublic");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "updatedAt");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "periodStart");
    __decorate([
        (0, core_1.Property)()
    ], Ranking.prototype, "periodEnd");
    Ranking = __decorate([
        (0, core_1.Entity)()
    ], Ranking);
    return Ranking;
}());
exports.Ranking = Ranking;
