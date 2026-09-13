import nodemailer from "nodemailer";

const REQUIRED_MAILER_ENV = ["EMAIL_USER", "EMAIL_PASSWORD"] as const;
if (process.env.NEXT_PHASE !== "phase-production-build") {
  for (const key of REQUIRED_MAILER_ENV) {
    if (!process.env[key]) {
      throw new Error(`[mailer] Variable d'environnement manquante: ${key}`);
    }
  }
}
let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return cachedTransporter;
}

interface SendMailParams {
  to: string;
  subject: string;
  html: string;
}

const FROM_NAME = process.env.EMAIL_FROM_NAME || "TOCTOC";

export async function sendMail({ to, subject, html }: SendMailParams) {
  try {
    await getTransporter().sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
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