import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { username } from "better-auth/plugins/username";
import { admin, phoneNumber, customSession, emailOTP } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { Resend } from 'resend';
import { sendMail } from "@/app/lib/mailer";
import {
  isPasswordValid,
  isPasswordPwned,
  isEmailValidWithVerification,
} from "@/app/lib/validation/registerValidation";
import { nextCookies } from "better-auth/next-js";
const resend = new Resend(process.env.RESEND_API_KEY);
const REQUIRED_ENV = [
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "TIKTOK_CLIENT_KEY",
  "TIKTOK_CLIENT_SECRET",
  "KICKBOX_API_KEY",
] as const;
if (process.env.NEXT_PHASE !== "phase-production-build") {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`[auth] Variable d'environnement manquante: ${key}`);
    }
  }
}
const REQUIRED_CONSENTS = [
  "LOCATION_ACCESS",
  "NO_VPN",
  "VR_CONFERENCE",
  "TERMS_OF_USE",
] as const;
type ConsentPayload = Partial<Record<(typeof REQUIRED_CONSENTS)[number], boolean>>;
function getClientIp(headers: Headers | undefined): string | null {
  const forwarded = headers?.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers?.get("x-real-ip") ?? null;
}
async function runSecurityChecks(ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]) {
  const ip = getClientIp(ctx.headers);
  if (ctx.path === "/sign-in/email" || ctx.path === "/sign-up/email") {
    console.log("Auth event:", {
      path: ctx.path,
      timestamp: new Date().toISOString(),
      ip: ip ?? "unknown",
      userAgent: ctx.headers?.get("user-agent") || "unknown",
    });
  }
}
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }: { user: { email: string }, url: string }) => {
      try {
        await resend.emails.send({
          from: `TOCTOC <${process.env.RESEND_FROM_EMAIL}>`,
          to: user.email,
          subject: "Reset your TOCTOC password",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #432dd7;">Password Reset</h2>
              <p>Click the button below to reset your password.</p>
              <a href="${url}" style="display:inline-block; background:#432dd7; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">
                Reset my password
              </a>
              <p style="color:#888; font-size:12px; margin-top:24px;">
                If you did not request this reset, please ignore this email — your current password remains valid.
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error("Erreur envoi email de réinitialisation:", err);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }, url: string }) => {
      await sendMail({
        to: user.email,
        subject: "Verify your TOCTOC email address",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #432dd7;">Welcome to TOCTOC!</h2>
            <p>Click the button below to verify your email address.</p>
            <a href="${url}" style="display:inline-block; background:#432dd7; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">
              Verify my email
            </a>
            <p style="color:#888; font-size:12px; margin-top:24px;">
              This link expires in 24 hours. If you did not request this, please ignore this email.
            </p>
          </div>
        `,
      });
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 5,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 300, max: 3 },
      "/sign-up/email": { window: 3600, max: 5 },
      "/forget-password": { window: 3600, max: 3 },
      "/phone-number/send-otp": { window: 3600, max: 5 },
      "/phone-number/verify": { window: 300, max: 5 },
      "/email-otp/send-verification-otp": { window: 3600, max: 5 },
      "/email-otp/verify-email": { window: 300, max: 5 },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 60 * 5,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: "/",
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    cleanupExpiredSessions: true,
  },
  plugins: [
    username(),
    admin(),
    nextCookies(),
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      async sendVerificationOTP({ email, otp, type }) {
        let subject = "Your TOCTOC verification code";
        let intro = "Here is your verification code:";
        if (type === "sign-in") {
          subject = "Your TOCTOC sign-in code";
          intro = "Use this code to sign in:";
        } else if (type === "forget-password") {
          subject = "Your TOCTOC password reset code";
          intro = "Use this code to reset your password:";
        } else if (type === "email-verification") {
          subject = "Verify your TOCTOC email address";
          intro = "Use this code to verify your email address:";
        }
        await sendMail({
          to: email,
          subject,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #432dd7;">${subject}</h2>
              <p>${intro}</p>
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #432dd7;">
                ${otp}
              </p>
              <p style="color:#888; font-size:12px; margin-top:24px;">
                This code expires in 5 minutes. If you did not request this, please ignore this email.
              </p>
            </div>
          `,
        });
      },
    }),
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      requireVerification: true,
      sendOTP: async ({ phoneNumber, code }: { phoneNumber: string, code: string }) => {
        if (process.env.NODE_ENV === "production") {
          throw new APIError("NOT_IMPLEMENTED", {
            message: "Fournisseur SMS non configuré.",
          });
        }
        console.log(`[DEV] OTP pour ${phoneNumber}: ${code}`);
      },
      sendPasswordResetOTP: async ({ phoneNumber, code }: { phoneNumber: string, code: string }) => {
        if (process.env.NODE_ENV === "production") {
          throw new APIError("NOT_IMPLEMENTED", {
            message: "Fournisseur SMS non configuré.",
          });
        }
        console.log(`[DEV] OTP réinitialisation pour ${phoneNumber}: ${code}`);
      },
    }),
    customSession(async ({ user, session }) => {
      return {
        session,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: (user as any).image,
          phone: (user as any).phone,
          phoneVerified: (user as any).phoneVerified,
          accountType: (user as any).accountType,
          clientType: (user as any).clientType,
          companyName: (user as any).companyName,
          providerType: (user as any).providerType,
          bio: (user as any).bio,
          isActive: (user as any).isActive,
          currency: (user as any).currency,
          verificationStatus: (user as any).verificationStatus,
          acceptNewsletter: (user as any).acceptNewsletter,
          isDemo: (user as any).isDemo,
           website:   (user as any).website,
      instagram: (user as any).instagram,
      facebook:  (user as any).facebook,
      tiktok:    (user as any).tiktok,
      linkedin:  (user as any).linkedin,
      youtube:   (user as any).youtube,
      twitter:   (user as any).twitter,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    }),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      await runSecurityChecks(ctx);
      if (ctx.path === "/sign-up/email") {
        const email = ctx.body?.email as string | undefined;
        const password = ctx.body?.password as string | undefined;
        const consents = ctx.body?.consents as ConsentPayload | undefined;
        if (email) {
          const isValidEmail = await isEmailValidWithVerification(email);
          if (!isValidEmail) {
            throw new APIError("BAD_REQUEST", {
              message:
                "Cette adresse email n'est pas autorisée. Merci d'utiliser une adresse email valide et permanente.",
            });
          }
        }
        if (password && !isPasswordValid(password)) {
          throw new APIError("BAD_REQUEST", {
            message:
              "Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial.",
          });
        }
        if (password && (await isPasswordPwned(password))) {
          throw new APIError("BAD_REQUEST", {
            message:
              "Ce mot de passe a été trouvé dans une fuite de données connue. Merci d'en choisir un autre.",
          });
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email" || ctx.path === "/sign-up/email") {
        console.log("Auth event completed:", {
          path: ctx.path,
          success: !ctx.error,
          timestamp: new Date().toISOString(),
        });
      }
      if (ctx.path === "/sign-up/email" && !ctx.error) {
        const newUser = ctx.context?.newSession?.user;
        const consents = ctx.body?.consents as ConsentPayload | undefined;
        const ip = getClientIp(ctx.headers);
        if (newUser?.id && consents) {
          try {
            await prisma.userConsent.createMany({
              data: REQUIRED_CONSENTS.map((type) => ({
                userId: newUser.id,
                type,
                accepted: true,
                acceptedAt: new Date(),
                ipAddress: ip,
              })),
              skipDuplicates: true,
            });
          } catch (err) {
            console.error("Erreur enregistrement des consentements:", err);
          }
        }
      }
    }),
  },
  user: {
  additionalFields: {
    website:   { type: "string", required: false },
    instagram: { type: "string", required: false },
    facebook:  { type: "string", required: false },
    tiktok:    { type: "string", required: false },
    linkedin:  { type: "string", required: false },
    youtube:   { type: "string", required: false },
    twitter:   { type: "string", required: false },
    accountType: { type: "string", required: false, defaultValue: "CLIENT" },
    role:        { type: "string", required: false, defaultValue: "user" },
    clientType:  { type: "string", required: false },
    companyName: { type: "string", required: false },
    rccmNumber:  { type: "string", required: false },
    providerType: { type: "string", required: false },
    bio:          { type: "string", required: false },
    isActive:     { type: "boolean", required: false, defaultValue: true },
    hourlyRate:   { type: "number", required: false },
    currency:     { type: "string", required: false, defaultValue: "XOF" },
    verificationMethod: { type: "string", required: false, defaultValue: "email" },
    verificationStatus: { type: "string", required: false, defaultValue: "PENDING" },
    verificationLevel:  { type: "string", required: false },
    verifiedBy:         { type: "string", required: false },
    verifiedAt:         { type: "date", required: false },
    verificationNotes:  { type: "string", required: false },
    phone:            { type: "string", required: false },
    phoneCountryCode: { type: "string", required: false, defaultValue: "+225" },
    phoneVerified:    { type: "boolean", required: false, defaultValue: false },
    acceptNewsletter: { type: "boolean", required: false, defaultValue: false },
    isDemo:        { type: "boolean", required: false, defaultValue: false },
    demoExpiresAt: { type: "date", required: false },
    lastLatitude:          { type: "number", required: false },
    lastLongitude:         { type: "number", required: false },
    lastLocationUpdatedAt: { type: "date", required: false },
    lastKnownRegion:       { type: "string", required: false },
    locationVerified:      { type: "boolean", required: false, defaultValue: false },
    banned:     { type: "boolean", required: false, defaultValue: false },
    banReason:  { type: "string", required: false },
    banExpires: { type: "date", required: false },
  },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      disablePKCE: false,
      mapProfileToUser: (profile) => {
        return {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
        };
      },
    },
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY as string,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET as string,
      disablePKCE: true,
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL as string,
    "http://localhost:3000",
    "https://toctoc1.vercel.app",
  ],
});