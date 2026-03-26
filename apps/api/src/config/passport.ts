import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from './env.js';

// No-op serialization — we don't use sessions
passport.serializeUser((_user, done) => {
  done(null, _user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value ?? '',
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        };
        done(null, user as unknown as Express.User);
      },
    ),
  );
}

// GitHub OAuth Strategy
if (env.GITHUB_CLIENT_ID) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
      },
      (
        _accessToken: string,
        _refreshToken: string,
        profile: { id: string; emails?: Array<{ value: string }>; displayName?: string; username?: string; photos?: Array<{ value: string }> },
        done: (err: Error | null, user?: Express.User) => void,
      ) => {
        const user = {
          githubId: profile.id,
          email: profile.emails?.[0]?.value ?? '',
          name: profile.displayName || profile.username || '',
          avatar: profile.photos?.[0]?.value,
        };
        done(null, user as unknown as Express.User);
      },
    ),
  );
}

export default passport;
