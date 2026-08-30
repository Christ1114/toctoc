const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("🔑 API Key:", process.env.RESEND_API_KEY?.substring(0, 10) + "...");
console.log("📧 From:", process.env.RESEND_FROM_EMAIL);

async function test() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'christgnabo5@gmail.com',
      subject: 'Test TOCTOC - Vérification',
      html: '<h1>Test email</h1><p>Si tu reçois ça, Resend fonctionne !</p>',
    });

    if (error) {
      console.error("❌ ERREUR:", error);
    } else {
      console.log("✅ SUCCÈS ! Email envoyé !");
      console.log("📧 ID:", data?.id);
    }
  } catch (err) {
    console.error("❌ ERREUR COMPLÈTE:", err);
  }
}

test();
