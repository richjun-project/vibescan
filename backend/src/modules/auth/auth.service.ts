import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../entities/user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '../../entities/subscription.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: EntityRepository<Subscription>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: EntityRepository<RefreshToken>,
    private readonly em: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      provider: 'local',
    });

    await this.em.persistAndFlush(user);

    // Create Free subscription for the new user
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(nextBillingDate.getDate() + 30); // 30 days from now

    const subscription = this.subscriptionRepository.create({
      user,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      monthlyScansLimit: 1,
      usedScans: 0,
      currentPeriodStart: now,
      currentPeriodEnd: nextBillingDate,
    });

    await this.em.persistAndFlush(subscription);

    return await this.generateToken(user, subscription);
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({ email }, { populate: ['subscription'] });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException('Please login with your social account');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure user has subscription
    if (!user.subscription) {
      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      const subscription = this.subscriptionRepository.create({
        user,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        monthlyScansLimit: 1,
        usedScans: 0,
        currentPeriodStart: now,
        currentPeriodEnd: nextBillingDate,
      });
      await this.em.persistAndFlush(subscription);
      user.subscription = subscription;
    }

    return await this.generateToken(user, user.subscription);
  }

  async oauthLogin(profile: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    picture?: string;
  }) {
    try {
      this.logger.log(`[OAUTH_LOGIN] Starting OAuth login for ${profile.email} via ${profile.provider}`);

      // Validate profile data
      if (!profile.email || !profile.providerId) {
        this.logger.error('[OAUTH_LOGIN] Invalid profile data:', profile);
        throw new Error('Invalid OAuth profile: missing email or providerId');
      }

      // Try to find user by provider and providerId first
      let user = await this.userRepository.findOne({
        provider: profile.provider,
        providerId: profile.providerId,
      }, { populate: ['subscription'] });

      if (!user) {
        this.logger.log(`[OAUTH_LOGIN] User not found by providerId, searching by email: ${profile.email}`);

        // Try to find by email
        user = await this.userRepository.findOne({ email: profile.email }, { populate: ['subscription'] });

        if (user) {
          this.logger.log(`[OAUTH_LOGIN] Linking OAuth account to existing user: ${profile.email}`);

          // Link OAuth account to existing user
          user.provider = profile.provider;
          user.providerId = profile.providerId;
          if (profile.picture) user.picture = profile.picture;
          await this.em.flush();
        } else {
          this.logger.log(`[OAUTH_LOGIN] Creating new user: ${profile.email}`);

          // Create new user
          user = this.userRepository.create({
            email: profile.email,
            name: profile.name || 'User',
            provider: profile.provider,
            providerId: profile.providerId,
            picture: profile.picture,
          });
          await this.em.persistAndFlush(user);

          this.logger.log(`[OAUTH_LOGIN] User created with ID: ${user.id}`);

          // Create Free subscription for the new user
          const now = new Date();
          const nextBillingDate = new Date(now);
          nextBillingDate.setDate(nextBillingDate.getDate() + 30);

          const subscription = this.subscriptionRepository.create({
            user,
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            monthlyScansLimit: 1,
            usedScans: 0,
            currentPeriodStart: now,
            currentPeriodEnd: nextBillingDate,
          });
          await this.em.persistAndFlush(subscription);
          user.subscription = subscription;

          this.logger.log(`[OAUTH_LOGIN] Free subscription created for user: ${user.id}`);
        }
      } else {
        this.logger.log(`[OAUTH_LOGIN] Existing user found: ${profile.email}`);
      }

      // Ensure user has subscription
      if (!user.subscription) {
        this.logger.warn(`[OAUTH_LOGIN] User ${user.id} has no subscription, creating one`);

        const now = new Date();
        const nextBillingDate = new Date(now);
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);

        const subscription = this.subscriptionRepository.create({
          user,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          monthlyScansLimit: 1,
          usedScans: 0,
          currentPeriodStart: now,
          currentPeriodEnd: nextBillingDate,
        });
        await this.em.persistAndFlush(subscription);
        user.subscription = subscription;

        this.logger.log(`[OAUTH_LOGIN] Subscription created for existing user: ${user.id}`);
      }

      this.logger.log(`[OAUTH_LOGIN] OAuth login successful for user: ${user.email}`);
      return await this.generateToken(user, user.subscription);
    } catch (error) {
      this.logger.error(`[OAUTH_LOGIN] OAuth login failed for ${profile.email}:`, error);
      this.logger.error(`[OAUTH_LOGIN] Profile data:`, JSON.stringify(profile));
      throw error;
    }
  }

  private async generateToken(user: User, subscription: Subscription) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Generate access token (30 minutes)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30m' });

    // Generate refresh token (7 days)
    const refreshTokenString = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    // Save refresh token to database
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenString,
      user,
      expiresAt: refreshTokenExpiry,
    });

    await this.em.persistAndFlush(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionPlan: subscription.plan,
        monthlyScansLimit: subscription.monthlyScansLimit,
        usedScans: subscription.usedScans,
        remainingScans: subscription.getRemainingScans(),
      },
    };
  }

  async validateUser(userId: number): Promise<User> {
    return this.userRepository.findOneOrFail({ id: userId }, { populate: ['subscription'] });
  }

  async refreshAccessToken(refreshTokenString: string) {
    // Find refresh token in database
    const refreshToken = await this.refreshTokenRepository.findOne(
      { token: refreshTokenString },
      { populate: ['user', 'user.subscription'] }
    );

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is valid
    if (!refreshToken.isValid()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Ensure user has subscription
    if (!refreshToken.user.subscription) {
      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setDate(nextBillingDate.getDate() + 30);

      const subscription = this.subscriptionRepository.create({
        user: refreshToken.user,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        monthlyScansLimit: 1,
        usedScans: 0,
        currentPeriodStart: now,
        currentPeriodEnd: nextBillingDate,
      });
      await this.em.persistAndFlush(subscription);
      refreshToken.user.subscription = subscription;
    }

    // Generate new tokens
    const newTokens = await this.generateToken(refreshToken.user, refreshToken.user.subscription);

    // Revoke old refresh token
    refreshToken.revokedAt = new Date();
    await this.em.flush();

    return newTokens;
  }

  async logout(refreshTokenString: string) {
    const refreshToken = await this.refreshTokenRepository.findOne({ token: refreshTokenString });

    if (refreshToken) {
      refreshToken.revokedAt = new Date();
      await this.em.flush();
    }

    return { message: 'Logged out successfully' };
  }
}
