import { NextResponse } from 'next/server';


const MAX_EMAIL_LENGTH = 254;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const VALID_TLDS = new Set([
  "com", "net", "org", "edu", "gov", "mil", "int",
  "io", "co", "ai", "app", "dev", "tech", "cloud",
  "africa", "ci", "fr", "en", "zh", "ar", "kr",
  "us", "uk", "ca", "au", "de", "es", "it", "pt",
  "nl", "be", "ch", "at", "se", "no", "dk", "fi",
  "ru", "cn", "jp", "in", "br", "mx", "za", "ng",
  "gh", "sn", "ml", "bf", "tg", "bj", "ne", "gn",
  "ma", "tn", "dz", "eg", "sa", "ae", "qa", "kw",
]);

const BLOCKED_DOMAINS = new Set([
  "example.com", "test.com", "localhost", "invalid.com",
  "tempmail.com", "throwaway.com", "mailinator.com",
  "guerrillamail.com", "10minutemail.com", "temp-mail.org",
  "fakeinbox.com", "trashmail.com", "dispostable.com",
  "getnada.com", "maildrop.cc", "mintemail.com",
  "nodemailer.com", "gmail.nodemailer.com",
  "yopmail.com", "yopmail.fr", "jetable.org", "jetable.com",
]);


function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s+/g, "");
}

function isLocalPartValid(localPart: string): boolean {
  return localPart.length > 0 
    && localPart.length <= 64 
    && !localPart.startsWith(".") 
    && !localPart.endsWith(".") 
    && !localPart.includes("..");
}

function isDomainValid(domain: string): boolean {
  if (!domain || domain.startsWith("-") || domain.endsWith("-") || domain.includes("..")) {
    return false;
  }

  if (BLOCKED_DOMAINS.has(domain)) {
    return false;
  }

  const domainParts = domain.split(".");
  for (let i = 0; i < domainParts.length - 1; i++) {
    const subDomain = domainParts.slice(i).join(".");
    if (BLOCKED_DOMAINS.has(subDomain)) {
      return false;
    }
  }

  return true;
}

function isTldValid(domainParts: string[]): boolean {
  const tld = domainParts[domainParts.length - 1];
  return tld !== undefined 
    && tld.length >= 2 
    && VALID_TLDS.has(tld) 
    && !/^\d+$/.test(tld);
}

function isEmailBasicValid(email: string): boolean {
  const normalized = normalizeEmail(email);

  const checks = [
    () => normalized.length <= MAX_EMAIL_LENGTH,
    () => !/[<>"'`]/.test(normalized),
    () => EMAIL_REGEX.test(normalized),
    () => (normalized.match(/@/g) || []).length === 1,
  ];

  if (!checks.every(check => check())) {
    return false;
  }

  const [localPart, domain] = normalized.split("@");
  const domainParts = domain.split(".");

  return isLocalPartValid(localPart) 
    && isDomainValid(domain) 
    && isTldValid(domainParts);
}


async function isDisposableEmailWithDisify(email: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  try {
    const res = await fetch(`https://disify.com/api/email/${normalizedEmail}`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      console.error("Erreur Disify:", res.status);
      return false;
    }

    const data = await res.json();
    return data.disposable === true || data.format === false;
  } catch (err) {
    console.error("Erreur Disify:", err);
    return false;
  }
}


interface KickboxResponse {
  result: "deliverable" | "undeliverable" | "risky" | "unknown";
  reason: string;
  role: boolean;
  free: boolean;
  disposable: boolean;
  accept_all: boolean;
  did_you_mean: string | null;
  sendex: number;
  email: string;
  user: string;
  domain: string;
  success: boolean;
  message: string | null;
}

async function verifyEmailWithKickbox(email: string): Promise<KickboxResponse | null> {
  const apiKey = process.env.KICKBOX_API_KEY;
  if (!apiKey) {
    console.warn("KICKBOX_API_KEY non définie, vérification Kickbox désactivée");
    return null;
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const res = await fetch(
      `https://api.kickbox.com/v2/verify?email=${encodeURIComponent(normalizedEmail)}&apikey=${apiKey}`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.error("Erreur Kickbox:", res.status);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Erreur Kickbox:", err);
    return null;
  }
}


export async function POST(request: Request) {
  try {
    const { email } = await request.json();


    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Email requis',
          basicValidation: false,
          disposableCheck: false,
          kickboxCheck: null
        },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    console.log('📧 Validation email:', normalizedEmail);

   
    const basicValid = isEmailBasicValid(normalizedEmail);
    
    if (!basicValid) {
      return NextResponse.json({
        valid: false,
        message: 'Email invalide (format incorrect)',
        basicValidation: false,
        disposableCheck: false,
        kickboxCheck: null
      });
    }

    
    const isDisposable = await isDisposableEmailWithDisify(normalizedEmail);
    
    if (isDisposable) {
      return NextResponse.json({
        valid: false,
        message: 'Email jetable détecté',
        basicValidation: true,
        disposableCheck: false,
        kickboxCheck: null
      });
    }

    
    const kickboxResult = await verifyEmailWithKickbox(normalizedEmail);
    
    if (!kickboxResult) {
   
      return NextResponse.json({
        valid: true,
        message: 'Email valide (vérification Kickbox indisponible)',
        basicValidation: true,
        disposableCheck: true,
        kickboxCheck: null
      });
    }

    
    const isValid = !kickboxResult.disposable 
      && kickboxResult.result !== "undeliverable"
      && kickboxResult.sendex >= 0.3;

    console.log('✅ Résultat validation:', {
      email: normalizedEmail,
      isValid,
      kickboxResult: kickboxResult.result,
      sendex: kickboxResult.sendex
    });

    return NextResponse.json({
      valid: isValid,
      message: isValid ? 'Email valide et vérifié' : 'Email invalide selon Kickbox',
      basicValidation: true,
      disposableCheck: true,
      kickboxCheck: isValid,
      kickboxDetails: {
        result: kickboxResult.result,
        disposable: kickboxResult.disposable,
        sendex: kickboxResult.sendex
      }
    });

  } catch (error) {
    console.error('❌ Erreur validation email:', error);
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Erreur lors de la validation',
        basicValidation: false,
        disposableCheck: false,
        kickboxCheck: null
      },
      { status: 500 }
    );
  }
}


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Paramètre email manquant' },
      { status: 400 }
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const basicValid = isEmailBasicValid(normalizedEmail);

  return NextResponse.json({
    email: normalizedEmail,
    basicValidation: basicValid,
    message: basicValid ? 'Email basique valide' : 'Email basique invalide'
  });
}