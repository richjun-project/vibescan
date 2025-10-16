"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.User = exports.SubscriptionPlan = exports.UserRole = void 0;
var core_1 = require("@mikro-orm/core");
var scan_entity_1 = require("./scan.entity");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["ADMIN"] = "admin";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var SubscriptionPlan;
(function (SubscriptionPlan) {
    SubscriptionPlan["FREE"] = "free";
    SubscriptionPlan["STARTER"] = "starter";
    SubscriptionPlan["PRO"] = "pro";
    SubscriptionPlan["ENTERPRISE"] = "enterprise";
})(SubscriptionPlan = exports.SubscriptionPlan || (exports.SubscriptionPlan = {}));
var User = /** @class */ (function () {
    function User() {
        this.role = UserRole.USER;
        this.subscriptionPlan = SubscriptionPlan.FREE;
        this.scansThisMonth = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.scans = new core_1.Collection(this);
    }
    __decorate([
        (0, core_1.PrimaryKey)()
    ], User.prototype, "id");
    __decorate([
        (0, core_1.Property)({ unique: true })
    ], User.prototype, "email");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], User.prototype, "password");
    __decorate([
        (0, core_1.Property)()
    ], User.prototype, "name");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], User.prototype, "provider");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], User.prototype, "providerId");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], User.prototype, "picture");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], User.prototype, "stripeCustomerId");
    __decorate([
        (0, core_1.Enum)(function () { return UserRole; })
    ], User.prototype, "role");
    __decorate([
        (0, core_1.Enum)(function () { return SubscriptionPlan; })
    ], User.prototype, "subscriptionPlan");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], User.prototype, "subscriptionExpiry");
    __decorate([
        (0, core_1.Property)()
    ], User.prototype, "scansThisMonth");
    __decorate([
        (0, core_1.Property)()
    ], User.prototype, "createdAt");
    __decorate([
        (0, core_1.Property)({ onUpdate: function () { return new Date(); } })
    ], User.prototype, "updatedAt");
    __decorate([
        (0, core_1.OneToMany)(function () { return scan_entity_1.Scan; }, function (scan) { return scan.user; })
    ], User.prototype, "scans");
    User = __decorate([
        (0, core_1.Entity)()
    ], User);
    return User;
}());
exports.User = User;
