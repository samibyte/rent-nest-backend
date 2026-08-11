import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { envVars } from "./env.js";
import { prisma } from "../lib/prisma.js";
import { UserRole } from "../../generated/prisma/enums.js";
import bcrypt from "bcryptjs";

export function initPassport() {
  if (!envVars.GOOGLE_CLIENT_ID || !envVars.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google OAuth disabled.",
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
        callbackURL: envVars.GOOGLE_CALLBACK_URL!,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: unknown, user?: Express.User | false) => void,
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            // New social user — create with placeholder password and TENANT role
            const placeholderHash = await bcrypt.hash(
              `_google_${profile.id}_${Date.now()}`,
              10,
            );
            user = await prisma.user.create({
              data: {
                name: profile.displayName || email.split("@")[0],
                email,
                password: placeholderHash,
                role: UserRole.TENANT,
                avatar: profile.photos?.[0]?.value ?? null,
              },
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}
