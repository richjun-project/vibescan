import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;

      // Safely extract email
      const email = emails?.[0]?.value;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Safely construct name with fallback
      let displayName = 'User';
      if (name) {
        if (name.givenName && name.familyName) {
          displayName = `${name.givenName} ${name.familyName}`.trim();
        } else if (name.givenName) {
          displayName = name.givenName;
        } else if (name.familyName) {
          displayName = name.familyName;
        } else if (profile.displayName) {
          displayName = profile.displayName;
        }
      } else if (profile.displayName) {
        displayName = profile.displayName;
      }

      // Safely extract picture
      const picture = photos?.[0]?.value || undefined;

      const user = {
        provider: 'google',
        providerId: id,
        email,
        name: displayName,
        picture,
      };

      done(null, user);
    } catch (error) {
      console.error('[GoogleStrategy] Error validating user:', error);
      done(error, null);
    }
  }
}
