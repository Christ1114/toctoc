import nodemailer from "nodemailer";

const REQUIRED_MAILER_ENV = ["GMAIL_USER", "GMAIL_APP_PASSWORD"] as const;

// On saute la validation pendant la phase de build Next.js (collecte de pages),
// où les vraies variables d'environnement runtime ne sont pas nécessaires.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  for (const key of REQUIRED_MAILER_ENV) {
    if (!process.env[key]) {
      throw new Error(`[mailer] Variable d'environnement manquante: ${key}`);
    }
  }
}

// Le transporter n'est créé qu'au premier envoi réel (lazy),
// jamais au chargement du module — donc jamais pendant le build.
let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
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

const FROM_NAME = process.env.GMAIL_FROM_NAME || "TOCTOC";

export async function sendMail({ to, subject, html }: SendMailParams) {
  try {
    await getTransporter().sendMail({
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