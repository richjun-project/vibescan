"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PaymentModule = void 0;
var common_1 = require("@nestjs/common");
var nestjs_1 = require("@mikro-orm/nestjs");
var user_entity_1 = require("../../entities/user.entity");
var subscription_entity_1 = require("../../entities/subscription.entity");
var stripe_service_1 = require("./stripe.service");
var payment_controller_1 = require("./payment.controller");
var PaymentModule = /** @class */ (function () {
    function PaymentModule() {
    }
    PaymentModule = __decorate([
        (0, common_1.Module)({
            imports: [nestjs_1.MikroOrmModule.forFeature([user_entity_1.User, subscription_entity_1.Subscription])],
            providers: [stripe_service_1.StripeService],
            controllers: [payment_controller_1.PaymentController],
            exports: [stripe_service_1.StripeService]
        })
    ], PaymentModule);
    return PaymentModule;
}());
exports.PaymentModule = PaymentModule;
