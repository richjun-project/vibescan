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
exports.StripeService = void 0;
var common_1 = require("@nestjs/common");
var stripe_1 = require("stripe");
var nestjs_1 = require("@mikro-orm/nestjs");
var user_entity_1 = require("../../entities/user.entity");
var subscription_entity_1 = require("../../entities/subscription.entity");
var StripeService = /** @class */ (function () {
    function StripeService(configService, userRepository, subscriptionRepository, em) {
        this.configService = configService;
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.em = em;
        // Price IDs - Should be set in environment variables
        this.PRICE_IDS = {
            starter: this.configService.get('STRIPE_PRICE_STARTER'),
            pro: this.configService.get('STRIPE_PRICE_PRO'),
            enterprise: this.configService.get('STRIPE_PRICE_ENTERPRISE')
        };
        var secretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!secretKey) {
            console.warn('STRIPE_SECRET_KEY not set. Payment features will be disabled.');
        }
        this.stripe = new stripe_1["default"](secretKey || 'sk_test_dummy', {
            apiVersion: '2024-12-18.acacia'
        });
    }
    StripeService.prototype.createCheckoutSession = function (userId, priceId, plan) {
        return __awaiter(this, void 0, void 0, function () {
            var user, customerId, customer, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepository.findOneOrFail({ id: userId })];
                    case 1:
                        user = _a.sent();
                        customerId = user.stripeCustomerId;
                        if (!!customerId) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.stripe.customers.create({
                                email: user.email,
                                metadata: {
                                    userId: user.id.toString()
                                }
                            })];
                    case 2:
                        customer = _a.sent();
                        customerId = customer.id;
                        user.stripeCustomerId = customerId;
                        return [4 /*yield*/, this.em.flush()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.stripe.checkout.sessions.create({
                            customer: customerId,
                            payment_method_types: ['card'],
                            line_items: [
                                {
                                    price: priceId,
                                    quantity: 1
                                },
                            ],
                            mode: 'subscription',
                            success_url: "".concat(this.configService.get('FRONTEND_URL'), "/payment/success?session_id={CHECKOUT_SESSION_ID}"),
                            cancel_url: "".concat(this.configService.get('FRONTEND_URL'), "/pricing"),
                            metadata: {
                                userId: user.id.toString(),
                                plan: plan
                            }
                        })];
                    case 5:
                        session = _a.sent();
                        return [2 /*return*/, {
                                sessionId: session.id,
                                url: session.url
                            }];
                }
            });
        });
    };
    StripeService.prototype.createPortalSession = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userRepository.findOneOrFail({ id: userId })];
                    case 1:
                        user = _a.sent();
                        if (!user.stripeCustomerId) {
                            throw new Error('No Stripe customer found');
                        }
                        return [4 /*yield*/, this.stripe.billingPortal.sessions.create({
                                customer: user.stripeCustomerId,
                                return_url: "".concat(this.configService.get('FRONTEND_URL'), "/dashboard")
                            })];
                    case 2:
                        session = _a.sent();
                        return [2 /*return*/, {
                                url: session.url
                            }];
                }
            });
        });
    };
    StripeService.prototype.handleWebhook = function (signature, body) {
        return __awaiter(this, void 0, void 0, function () {
            var webhookSecret, event, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
                        try {
                            event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
                        }
                        catch (err) {
                            throw new Error("Webhook signature verification failed: ".concat(err.message));
                        }
                        _a = event.type;
                        switch (_a) {
                            case 'checkout.session.completed': return [3 /*break*/, 1];
                            case 'customer.subscription.created': return [3 /*break*/, 3];
                            case 'customer.subscription.updated': return [3 /*break*/, 3];
                            case 'customer.subscription.deleted': return [3 /*break*/, 5];
                            case 'invoice.payment_succeeded': return [3 /*break*/, 7];
                            case 'invoice.payment_failed': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1: return [4 /*yield*/, this.handleCheckoutCompleted(event.data.object)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 3: return [4 /*yield*/, this.handleSubscriptionUpdated(event.data.object)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 5: return [4 /*yield*/, this.handleSubscriptionDeleted(event.data.object)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 7: return [4 /*yield*/, this.handleInvoicePaymentSucceeded(event.data.object)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 9: return [4 /*yield*/, this.handleInvoicePaymentFailed(event.data.object)];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        console.log("Unhandled event type: ".concat(event.type));
                        _b.label = 12;
                    case 12: return [2 /*return*/, { received: true }];
                }
            });
        });
    };
    StripeService.prototype.handleCheckoutCompleted = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, plan, user, subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = parseInt(session.metadata.userId);
                        plan = session.metadata.plan;
                        return [4 /*yield*/, this.userRepository.findOneOrFail({ id: userId })];
                    case 1:
                        user = _a.sent();
                        // Update user subscription plan
                        user.subscriptionPlan = plan;
                        return [4 /*yield*/, this.em.flush()];
                    case 2:
                        _a.sent();
                        subscription = this.subscriptionRepository.create({
                            user: user,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                            status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                            plan: plan
                        });
                        return [4 /*yield*/, this.em.persistAndFlush(subscription)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    StripeService.prototype.handleSubscriptionUpdated = function (stripeSubscription) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.subscriptionRepository.findOne({
                            stripeSubscriptionId: stripeSubscription.id
                        })];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) return [3 /*break*/, 3];
                        subscription.status = stripeSubscription.status;
                        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
                        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
                        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
                        return [4 /*yield*/, this.em.flush()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StripeService.prototype.handleSubscriptionDeleted = function (stripeSubscription) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.subscriptionRepository.findOne({
                            stripeSubscriptionId: stripeSubscription.id
                        }, { populate: ['user'] })];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) return [3 /*break*/, 3];
                        subscription.status = subscription_entity_1.SubscriptionStatus.CANCELED;
                        subscription.user.subscriptionPlan = 'free';
                        return [4 /*yield*/, this.em.flush()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StripeService.prototype.handleInvoicePaymentSucceeded = function (invoice) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Handle successful payment
                console.log('Payment succeeded for invoice:', invoice.id);
                return [2 /*return*/];
            });
        });
    };
    StripeService.prototype.handleInvoicePaymentFailed = function (invoice) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.subscriptionRepository.findOne({
                            stripeSubscriptionId: invoice.subscription
                        }, { populate: ['user'] })];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription) return [3 /*break*/, 3];
                        subscription.status = subscription_entity_1.SubscriptionStatus.PAST_DUE;
                        return [4 /*yield*/, this.em.flush()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StripeService.prototype.getPrices = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        starter: {
                            id: this.PRICE_IDS.starter,
                            name: 'Starter',
                            price: 29000,
                            currency: 'KRW',
                            interval: 'month',
                            features: [
                                '월 5회 스캔',
                                '모든 Free 기능',
                                'AI 요약',
                                'PDF 리포트',
                            ]
                        },
                        pro: {
                            id: this.PRICE_IDS.pro,
                            name: 'Pro',
                            price: 99000,
                            currency: 'KRW',
                            interval: 'month',
                            features: [
                                '무제한 스캔',
                                '모든 Starter 기능',
                                'AI Fix Guide',
                                'CI/CD 연동',
                                '우선 지원',
                            ]
                        },
                        enterprise: {
                            id: this.PRICE_IDS.enterprise,
                            name: 'Enterprise',
                            price: null,
                            currency: 'KRW',
                            interval: 'month',
                            features: [
                                '모든 Pro 기능',
                                '전담 CSM',
                                '온프레미스',
                                'SLA 보장',
                            ]
                        }
                    }];
            });
        });
    };
    StripeService = __decorate([
        (0, common_1.Injectable)(),
        __param(1, (0, nestjs_1.InjectRepository)(user_entity_1.User)),
        __param(2, (0, nestjs_1.InjectRepository)(subscription_entity_1.Subscription))
    ], StripeService);
    return StripeService;
}());
exports.StripeService = StripeService;
