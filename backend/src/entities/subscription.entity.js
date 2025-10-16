"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Subscription = exports.SubscriptionStatus = void 0;
var core_1 = require("@mikro-orm/core");
var user_entity_1 = require("./user.entity");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["TRIALING"] = "trialing";
})(SubscriptionStatus = exports.SubscriptionStatus || (exports.SubscriptionStatus = {}));
var Subscription = /** @class */ (function () {
    function Subscription() {
        this.status = SubscriptionStatus.TRIALING;
        this.cancelAtPeriodEnd = false;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    __decorate([
        (0, core_1.PrimaryKey)()
    ], Subscription.prototype, "id");
    __decorate([
        (0, core_1.ManyToOne)(function () { return user_entity_1.User; })
    ], Subscription.prototype, "user");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Subscription.prototype, "stripeCustomerId");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Subscription.prototype, "stripeSubscriptionId");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Subscription.prototype, "stripePriceId");
    __decorate([
        (0, core_1.Enum)(function () { return SubscriptionStatus; })
    ], Subscription.prototype, "status");
    __decorate([
        (0, core_1.Property)()
    ], Subscription.prototype, "plan");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Subscription.prototype, "currentPeriodStart");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Subscription.prototype, "currentPeriodEnd");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Subscription.prototype, "cancelAtPeriodEnd");
    __decorate([
        (0, core_1.Property)()
    ], Subscription.prototype, "createdAt");
    __decorate([
        (0, core_1.Property)({ onUpdate: function () { return new Date(); } })
    ], Subscription.prototype, "updatedAt");
    Subscription = __decorate([
        (0, core_1.Entity)()
    ], Subscription);
    return Subscription;
}());
exports.Subscription = Subscription;
