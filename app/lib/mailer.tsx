
import nodemailer from "nodemailer";

const REQUIRED_MAILER_ENV = ["GMAIL_USER", "GMAIL_APP_PASSWORD"] as const;

for (const key of REQUIRED_MAILER_ENV) {
  if (!process.env[key]) {
    throw new Error(`[mailer] Variable d'environnement manquante: ${key}`);
  }
}

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

const FROM_NAME = process.env.GMAIL_FROM_NAME || "TOCTOC";

export async function sendMail({ to, subject, html }: SendMailParams) {
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error("❌ Erreur envoi email (nodemailer/gmail):", err);
    return { success: false, error: err as Error };
  }
}