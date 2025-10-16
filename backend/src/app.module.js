"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var nestjs_1 = require("@mikro-orm/nestjs");
var bullmq_1 = require("@nestjs/bullmq");
var database_config_1 = require("./config/database.config");
var auth_module_1 = require("./modules/auth/auth.module");
var user_module_1 = require("./modules/user/user.module");
var scan_module_1 = require("./modules/scan/scan.module");
var ranking_module_1 = require("./modules/ranking/ranking.module");
var payment_module_1 = require("./modules/payment/payment.module");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                // Config
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env'
                }),
                // Database
                nestjs_1.MikroOrmModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (configService) {
                        return (0, database_config_1.getDatabaseConfig)(configService);
                    }
                }),
                // Queue
                bullmq_1.BullModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (configService) { return ({
                        connection: {
                            host: configService.get('REDIS_HOST', 'localhost'),
                            port: configService.get('REDIS_PORT', 6379)
                        }
                    }); }
                }),
                // Feature modules
                auth_module_1.AuthModule,
                user_module_1.UserModule,
                scan_module_1.ScanModule,
                ranking_module_1.RankingModule,
                payment_module_1.PaymentModule,
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
