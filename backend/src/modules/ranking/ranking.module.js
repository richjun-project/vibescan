"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.RankingModule = void 0;
var common_1 = require("@nestjs/common");
var nestjs_1 = require("@mikro-orm/nestjs");
var ranking_entity_1 = require("../../entities/ranking.entity");
var scan_entity_1 = require("../../entities/scan.entity");
var ranking_service_1 = require("./ranking.service");
var ranking_controller_1 = require("./ranking.controller");
var RankingModule = /** @class */ (function () {
    function RankingModule() {
    }
    RankingModule = __decorate([
        (0, common_1.Module)({
            imports: [nestjs_1.MikroOrmModule.forFeature([ranking_entity_1.Ranking, scan_entity_1.Scan])],
            providers: [ranking_service_1.RankingService],
            controllers: [ranking_controller_1.RankingController]
        })
    ], RankingModule);
    return RankingModule;
}());
exports.RankingModule = RankingModule;
