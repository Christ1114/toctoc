import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { headers } from 'next/headers';


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true' || true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


const rateLimit = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; 
const RATE_LIMIT_MAX = 5; 

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRate = rateLimit.get(ip);

  if (!userRate || (now - userRate.lastReset) > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (userRate.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userRate.count++;
  return true;
}

function isSpam(data: any): boolean {
 
  const spamPatterns = [
    /https?:\/\/(?!.*(google|facebook|twitter|linkedin|instagram|youtube))/i,
    /<a\s+href/i,
    /\b(viagra|casino|lottery|prize|winner|bitcoin|btc|crypto)\b/i,
    /\[url=|\[link=/i,
    /\b(buy now|click here|free money|work from home)\b/i,
  ];

  const content = `${data.message} ${data.email} ${data.name}`;
  return spamPatterns.some(pattern => pattern.test(content));
}


function validateInput(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

 
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Données invalides'] };
  }

 
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email requis');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Email invalide');
    }
    if (data.email.length > 254) {
      errors.push('Email trop long');
    }
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Nom requis');
  } else if (data.name.trim().length < 2) {
    errors.push('Nom trop court (min 2 caractères)');
  } else if (data.name.length > 100) {
    errors.push('Nom trop long (max 100 caractères)');
  }

 
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message requis');
  } else if (data.message.trim().length < 10) {
    errors.push('Message trop court (min 10 caractères)');
  } else if (data.message.length > 5000) {
    errors.push('Message trop long (max 5000 caractères)');
  }


  if (data.category) {
    const validCategories = ['usageQuestion', 'signupRequest', 'passwordRequest', 'paymentRequest'];
    if (!validCategories.includes(data.category)) {
      errors.push('Catégorie invalide');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export async function POST(request: Request) {
  try {
    
    const headersList = await headers();
    const origin = headersList.get('origin');
    const referer = headersList.get('referer');
    const host = headersList.get('host');

    // Vérifier l'origine par rapport au host réel de la requête
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          console.warn('🚫 Tentative d\'accès depuis origine non autorisée:', origin, 'vs host:', host);
          return NextResponse.json(
            { error: 'Origine non autorisée' },
            { status: 403 }
          );
        }
      } catch {
        console.warn('🚫 Origine malformée:', origin);
        return NextResponse.json(
          { error: 'Origine non autorisée' },
          { status: 403 }
        );
      }
    }

    // Vérifier le referer si l'origine n'est pas disponible
    if (!origin && referer && host) {
      try {
        const refererHost = new URL(referer).host;
        if (refererHost !== host) {
          console.warn('🚫 Tentative d\'accès depuis referer non autorisé:', referer, 'vs host:', host);
          return NextResponse.json(
            { error: 'Origine non autorisée' },
            { status: 403 }
          );
        }
      } catch {
        console.warn('🚫 Referer malformé:', referer);
      }
    }

 
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || 
               headersList.get('x-real-ip') || 
               'unknown';

   
    if (!checkRateLimit(ip)) {
      console.warn('🚫 Rate limit dépassé pour IP:', ip);
      return NextResponse.json(
        { error: 'Trop de messages envoyés. Veuillez réessayer dans 15 minutes.' },
        { status: 429 }
      );
    }

    
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) {
      return NextResponse.json(
        { error: 'Message trop volumineux' },
        { status: 413 }
      );
    }


    let data;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    
    if (data.honeypot || data.website) {
      console.log('🤖 Bot détecté (honeypot)');
      return NextResponse.json(
        { success: true, message: 'Message envoyé avec succès !' },
        { status: 200 }
      );
    }

  
    if (data.formTime && Date.now() - data.formTime < 3000) {
      console.log('🤖 Bot détecté (remplissage trop rapide)');
      return NextResponse.json(
        { error: 'Veuillez réessayer' },
        { status: 400 }
      );
    }


    const validation = validateInput(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

 
    if (isSpam(data)) {
      console.warn('🚫 Contenu spam détecté');
      return NextResponse.json(
        { success: true, message: 'Message envoyé avec succès !' },
        { status: 200 }
      );
    }

    const cleanName = data.name.replace(/<[^>]*>/g, '').trim().slice(0, 100);
    const cleanEmail = data.email.trim().toLowerCase().slice(0, 254);
    const cleanMessage = data.message.replace(/<[^>]*>/g, '').trim().slice(0, 5000);
    const cleanCategoryLabel = data.categoryLabel || data.category || 'Non spécifié';

   
    const mailOptions = {
      from: `"${cleanName}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: cleanEmail,
      subject: `📩 ${cleanCategoryLabel} - Message de ${cleanName}`,
      text: `
        📋 NOUVEAU MESSAGE DE CONTACT
        
        ═══════════════════════════
        
        📂 Catégorie : ${cleanCategoryLabel}
        👤 Nom : ${cleanName}
        📧 Email : ${cleanEmail}
        
        ═══════════════════════════
        
        💬 Message :
        ${cleanMessage}
        
        ═══════════════════════════
        
        📅 Date : ${new Date().toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Africa/Abidjan'
        })}
        
        🌐 IP: ${ip}
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #432dd7, #6b52e6); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📩 Nouveau Message de Contact</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 5px; margin-bottom: 10px;">
                  <strong>📂 Catégorie :</strong><br>
                  <span style="font-size: 16px;">${cleanCategoryLabel}</span>
                </td>
              </tr>
              <tr><td style="height: 10px;"></td></tr>
              <tr>
                <td style="padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <strong>👤 Nom :</strong><br>
                  <span style="font-size: 16px;">${cleanName}</span>
                </td>
              </tr>
              <tr><td style="height: 10px;"></td></tr>
              <tr>
                <td style="padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <strong>📧 Email :</strong><br>
                  <a href="mailto:${cleanEmail}" style="color: #432dd7; text-decoration: none; font-size: 16px;">${cleanEmail}</a>
                </td>
              </tr>
              <tr><td style="height: 10px;"></td></tr>
              <tr>
                <td style="padding: 15px; background: white; border: 1px solid #e0e0e0; border-radius: 5px;">
                  <strong>💬 Message :</strong><br>
                  <p style="white-space: pre-wrap; margin-top: 10px; font-size: 15px; line-height: 1.6;">${cleanMessage}</p>
                </td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; padding: 15px; background: #f0f0f0; border-radius: 5px; font-size: 12px; color: #666;">
              <p style="margin: 0;">
                📅 Envoyé le : ${new Date().toLocaleString('fr-FR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                  timeZone: 'Africa/Abidjan'
                })}
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>Cet email a été envoyé depuis votre formulaire de contact</p>
          </div>
        </body>
        </html>
      `,
    };

    // 12. Envoyer l'email
    console.log('📧 Tentative d\'envoi d\'email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès !');

    return NextResponse.json(
      { 
        success: true,
        message: 'Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}