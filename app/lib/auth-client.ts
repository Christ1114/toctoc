import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins";
import type { auth } from "@/app/lib/auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000",
  plugins: [
    inferAdditionalFields<typeof auth>(),
    phoneNumberClient(),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const signUpWithEmail = async (data: {
  name: string;
  email: string;
  phone?: string;
  password: string;
  accountType?: string;
  clientType?: string;
  companyName?: string;
  rccmNumber?: string;
  providerType?: string;
  bio?: string;
  verificationMethod?: 'email' | 'phone';
  acceptNewsletter?: boolean;
  consents?: Record<string, boolean>;
}) => {
  const { data: result, error } = await authClient.signUp.email({
    email: data.email,
    password: data.password,
    name: data.name,
    phone: data.phone,
    accountType: data.accountType,
    clientType: data.clientType,
    companyName: data.companyName,
    rccmNumber: data.rccmNumber,
    providerType: data.providerType,
    bio: data.bio,
    verificationMethod: data.verificationMethod,
    acceptNewsletter: data.acceptNewsletter,
    
  });

  return { result, error };
};

export const signInWithEmail = async (data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  const { data: result, error } = await authClient.signIn.email({
    email: data.email,
    password: data.password,
    rememberMe: data.rememberMe,
  });

  return { result, error };
};

export const signInWithGoogle = async () => {
  const { data: result, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/dashboard",
  });

  return { result, error };
};

export const signInWithTikTok = async () => {
  const { data: result, error } = await authClient.signIn.social({
    provider: "tiktok",
    callbackURL: "/dashboard",
    errorCallbackURL: "/sign-in?error=tiktok",
  });

  return { success: !error, error };
};

export const signOut = async () => {
  const { data: result, error } = await authClient.signOut();
  return { result, error };
};

export const getSession = async () => {
  const { data: session, error } = await authClient.getSession();
  return { session, error };
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { session } = await getSession();
  return !!session;
};

export const getCurrentUser = async () => {
  const { session } = await getSession();
  return session?.user || null;
};

export const verifyEmail = async (token: string) => {
  const { data: result, error } = await authClient.verifyEmail({
    query: { token },
  });
  return { result, error };
};

export const sendVerificationEmail = async (email: string) => {
  const { data: result, error } = await authClient.sendVerificationEmail({
    email,
  });
  return { result, error };
};

export const forgotPassword = async (email: string, redirectTo?: string) => {
  const { data: result, error } = await authClient.requestPasswordReset({
    email,
    redirectTo: redirectTo || "/resetpassword",
  });
  return { result, error };
};

export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}) => {
  const { data: result, error } = await authClient.resetPassword({
    newPassword: data.newPassword,
    token: data.token,
  });
  return { result, error };
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  const { data: result, error } = await authClient.changePassword({
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
  return { result, error };
};

export const sendPhoneOTP = async (phoneNumber: string) => {
  const { data: result, error } = await authClient.phoneNumber.sendOtp({
    phoneNumber,
  });
  return { result, error };
};

export const verifyPhoneOTP = async (data: {
  phoneNumber: string;
  code: string;
}) => {
  const { data: result, error } = await authClient.phoneNumber.verify({
    phoneNumber: data.phoneNumber,
    code: data.code,
  });
  return { result, error };
};

export const updateUser = async (data: {
  name?: string;
  image?: string;
  bio?: string;
  companyName?: string;
  rccmNumber?: string;
  clientType?: string;
  providerType?: string;
  verificationMethod?: 'email' | 'phone'; 
}) => {
  const { data: result, error } = await authClient.updateUser(data);
  return { result, error };
};