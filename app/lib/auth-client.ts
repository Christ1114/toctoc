"use client";

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
export interface UserData {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  [key: string]: any; 
}
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
  try {
    const { data: result, error } = await authClient.signUp.email({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
  
      ...(data.accountType && { accountType: data.accountType }),
      ...(data.clientType && { clientType: data.clientType }),
      ...(data.companyName && { companyName: data.companyName }),
      ...(data.rccmNumber && { rccmNumber: data.rccmNumber }),
      ...(data.providerType && { providerType: data.providerType }),
      ...(data.bio && { bio: data.bio }),
      ...(data.verificationMethod && { verificationMethod: data.verificationMethod }),
      ...(data.acceptNewsletter !== undefined && { acceptNewsletter: data.acceptNewsletter }),
    });

    console.log("SignUp result:", { result, error }); 
    return { result, error };
  } catch (err) {
    console.error("SignUp error:", err);
    return { result: null, error: err as Error };
  }
};

export const signInWithEmail = async (data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  try {
    const { data: result, error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    });

    return { result, error };
  } catch (err) {
    console.error("SignIn error:", err);
    return { result: null, error: err as Error };
  }
};

export const signInWithGoogle = async () => {
  try {
    const { data: result, error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/app",
    });

    return { result, error };
  } catch (err) {
    console.error("Google SignIn error:", err);
    return { result: null, error: err as Error };
  }
};

export const signInWithTikTok = async () => {
  try {
    const { data: result, error } = await authClient.signIn.social({
      provider: "tiktok",
      callbackURL: "/app",
      errorCallbackURL: "/sign-in?error=tiktok",
    });

    return { success: !error, error };
  } catch (err) {
    console.error("TikTok SignIn error:", err);
    return { success: false, error: err as Error };
  }
};

export const signOut = async () => {
  try {
    const { data: result, error } = await authClient.signOut();
    return { result, error };
  } catch (err) {
    console.error("SignOut error:", err);
    return { result: null, error: err as Error };
  }
};

export const getSession = async () => {
  try {
    const { data: session, error } = await authClient.getSession();
    
    if (error) {
      console.error("GetSession error:", error);
      return { session: null, error };
    }
    
    return { session, error: null };
  } catch (err) {
    console.error("GetSession exception:", err);
    return { session: null, error: err as Error };
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { session } = await getSession();
  return !!session?.user;
};

export const getCurrentUser = async (): Promise<UserData | null> => {
  try {
    const { session } = await getSession();
    return (session?.user as UserData) || null;
  } catch (err) {
    console.error("GetCurrentUser error:", err);
    return null;
  }
};

export const verifyEmail = async (token: string) => {
  try {
    const { data: result, error } = await authClient.verifyEmail({
      query: { token },
    });
    return { result, error };
  } catch (err) {
    console.error("VerifyEmail error:", err);
    return { result: null, error: err as Error };
  }
};


export const sendVerificationEmail = async (email: string) => {
  try {
    console.log("Envoi email de vérification à:", email); 
    
    const { data: result, error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000"}/verify-email`,
    });
    
    console.log("Résultat envoi email:", { result, error }); 
    return { result, error };
  } catch (err) {
    console.error("SendVerificationEmail error:", err);
    return { result: null, error: err as Error };
  }
};

export const forgotPassword = async (email: string, redirectTo?: string) => {
  try {
    const { data: result, error } = await authClient.requestPasswordReset({
      email,
      redirectTo: redirectTo || "/resetpassword",
    });
    return { result, error };
  } catch (err) {
    console.error("ForgotPassword error:", err);
    return { result: null, error: err as Error };
  }
};

export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}) => {
  try {
    const { data: result, error } = await authClient.resetPassword({
      newPassword: data.newPassword,
      token: data.token,
    });
    return { result, error };
  } catch (err) {
    console.error("ResetPassword error:", err);
    return { result: null, error: err as Error };
  }
};

export const changePassword = async (data: {
  currentPassword: string;
  newPassword: string;
}) => {
  try {
    const { data: result, error } = await authClient.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return { result, error };
  } catch (err) {
    console.error("ChangePassword error:", err);
    return { result: null, error: err as Error };
  }
};


export const sendPhoneOTP = async (phoneNumber: string) => {
  try {
    console.log("Envoi OTP à:", phoneNumber);
    
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    const { data: result, error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: cleanPhone,
    });
    
    console.log("Résultat envoi OTP:", { result, error }); 
    return { result, error };
  } catch (err) {
    console.error("SendPhoneOTP error:", err);
    return { result: null, error: err as Error };
  }
};

export const verifyPhoneOTP = async (data: {
  phoneNumber: string;
  code: string;
}) => {
  try {
   
    const cleanPhone = data.phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    console.log("Vérification OTP:", { phone: cleanPhone, code: data.code }); 
    
    const { data: result, error } = await authClient.phoneNumber.verify({
      phoneNumber: cleanPhone,
      code: data.code,
    });
    
    console.log("Résultat vérification OTP:", { result, error }); 
    return { result, error };
  } catch (err) {
    console.error("VerifyPhoneOTP error:", err);
    return { result: null, error: err as Error };
  }
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
  try {
    
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    
    const { data: result, error } = await authClient.updateUser(cleanData);
    return { result, error };
  } catch (err) {
    console.error("UpdateUser error:", err);
    return { result: null, error: err as Error };
  }
};