"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Scan = exports.ScanGrade = exports.ScanStatus = void 0;
var core_1 = require("@mikro-orm/core");
var user_entity_1 = require("./user.entity");
var vulnerability_entity_1 = require("./vulnerability.entity");
var ScanStatus;
(function (ScanStatus) {
    ScanStatus["PENDING"] = "pending";
    ScanStatus["RUNNING"] = "running";
    ScanStatus["COMPLETED"] = "completed";
    ScanStatus["FAILED"] = "failed";
})(ScanStatus = exports.ScanStatus || (exports.ScanStatus = {}));
var ScanGrade;
(function (ScanGrade) {
    ScanGrade["A"] = "A";
    ScanGrade["B"] = "B";
    ScanGrade["C"] = "C";
    ScanGrade["D"] = "D";
})(ScanGrade = exports.ScanGrade || (exports.ScanGrade = {}));
var Scan = /** @class */ (function () {
    function Scan() {
        this.status = ScanStatus.PENDING;
        this.isPublic = false;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.vulnerabilities = new core_1.Collection(this);
    }
    __decorate([
        (0, core_1.PrimaryKey)()
    ], Scan.prototype, "id");
    __decorate([
        (0, core_1.Property)()
    ], Scan.prototype, "domain");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Scan.prototype, "repositoryUrl");
    __decorate([
        (0, core_1.ManyToOne)(function () { return user_entity_1.User; })
    ], Scan.prototype, "user");
    __decorate([
        (0, core_1.Enum)(function () { return ScanStatus; })
    ], Scan.prototype, "status");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Scan.prototype, "score");
    __decorate([
        (0, core_1.Enum)(function () { return ScanGrade; })
    ], Scan.prototype, "grade");
    __decorate([
        (0, core_1.Property)({ type: 'json', nullable: true })
    ], Scan.prototype, "results");
    __decorate([
        (0, core_1.Property)()
    ], Scan.prototype, "isPublic");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Scan.prototype, "shareToken");
    __decorate([
        (0, core_1.Property)()
    ], Scan.prototype, "createdAt");
    __decorate([
        (0, core_1.Property)({ onUpdate: function () { return new Date(); } })
    ], Scan.prototype, "updatedAt");
    __decorate([
        (0, core_1.Property)({ nullable: true })
    ], Scan.prototype, "completedAt");
    __decorate([
        (0, core_1.OneToMany)(function () { return vulnerability_entity_1.Vulnerability; }, function (vulnerability) { return vulnerability.scan; })
    ], Scan.prototype, "vulnerabilities");
    Scan = __decorate([
        (0, core_1.Entity)()
    ], Scan);
    return Scan;
}());
exports.Scan = Scan;
