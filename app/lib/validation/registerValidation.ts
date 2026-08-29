import { parsePhoneNumber, CountryCode } from "libphonenumber-js";


export type Role = "CLIENT" | "PROVIDER";
export type ClientType = "INDIVIDUAL" | "AGENCY";
export type ProviderType =
  | "BABYSITTER"
  | "GARDE_PERISCOLAIRE"
  | "MENAGE"
  | "AIDE_PERSONNES_AGEES"
  | "RESIDENTIEL"
  | "COURT_TERME";
export type VerificationMethod = "email" | "phone";

export interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptLocation: boolean;
  acceptNoVpn: boolean;
  acceptVr: boolean;
  role: Role;
  clientType?: ClientType;
  companyName?: string;
  rccmNumber?: string;
  providerType?: ProviderType;
  bio?: string;
  verificationMethod: VerificationMethod;
  acceptNewsletter: boolean;
}

export interface RegisterFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  acceptLocation?: string;
  acceptNoVpn?: string;
  acceptVr?: string;
  companyName?: string;
  rccmNumber?: string;
  bio?: string;
}

// ============ CONSTANTES ============
type ValidationContent = Record<string, { value: string }>;

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PHONE_LENGTH = 15;
export const MAX_BIO_LENGTH = 500;
export const MAX_COMPANY_NAME_LENGTH = 100;
export const MAX_RCCM_LENGTH = 50;

export const PASSWORD_REGEX = new RegExp(
  `^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{${MIN_PASSWORD_LENGTH},${MAX_PASSWORD_LENGTH}}$`
);

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

const VALID_COUNTRY_CODES = [
  "+225", "+1", "+44", "+86", "+33", "+49", "+39", "+34",
  "+351", "+32", "+41", "+7", "+81", "+82", "+91",
  "+234", "+233", "+221", "+223", "+226", "+228", "+229",
  "+227", "+224", "+212", "+216", "+213", "+20",
  "+966", "+971", "+974", "+965",
];

const COMMON_PASSWORDS = new Set([
  "password", "123456", "qwerty", "azerty", "admin",
  "toctoc123", "toctoc2024", "password123", "123456789",
  "motdepasse", "motdepasse123", "abcd1234", "qwerty123",
]);

// ============ FONCTIONS DE NETTOYAGE ============
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/`/g, "&#96;");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s+/g, "");
}

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }
  return cleaned;
}

// ============ VALIDATION EMAIL ============
export async function isDisposableEmailWithDisify(email: string): Promise<boolean> {
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

export interface KickboxResponse {
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

export async function verifyEmailWithKickbox(email: string): Promise<KickboxResponse | null> {
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

export async function isEmailValidWithVerification(email: string): Promise<boolean> {
  if (await isDisposableEmailWithDisify(email)) {
    return false;
  }

  const kickboxResult = await verifyEmailWithKickbox(email);
  
  if (!kickboxResult) {
    return true;
  }

  return !kickboxResult.disposable 
    && kickboxResult.result !== "undeliverable"
    && kickboxResult.sendex >= 0.3;
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

export function isEmailValid(email: string): boolean {
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

// ============ VALIDATION TÉLÉPHONE ============
export function isPhoneValid(phone: string, country: string = "CI"): boolean {
  const cleaned = normalizePhone(phone);

  const basicChecks = [
    () => cleaned.length > 0,
    () => cleaned.startsWith("+"),
    () => cleaned.length >= 10,
    () => cleaned.length <= MAX_PHONE_LENGTH,
    () => /^\+\d+$/.test(cleaned),
  ];

  if (!basicChecks.every(check => check())) {
    return false;
  }

  try {
    const parsed = parsePhoneNumber(cleaned, country as CountryCode);
    return parsed.isValid() && parsed.isPossible();
  } catch {
    return false;
  }
}

export function extractCountryCode(phone: string): string | null {
  const cleaned = normalizePhone(phone);
  
  if (!cleaned.startsWith("+")) {
    return null;
  }

  try {
    const parsed = parsePhoneNumber(cleaned);
    return parsed.countryCallingCode ? `+${parsed.countryCallingCode}` : null;
  } catch {
    return null;
  }
}

export function isValidCountryCode(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  
  return cleaned.startsWith("+") 
    && VALID_COUNTRY_CODES.some(code => cleaned.startsWith(code));
}

// ============ VALIDATION MOT DE PASSE ============
export function isPasswordValid(password: string): boolean {
  const checks = [
    () => password.length >= MIN_PASSWORD_LENGTH,
    () => password.length <= MAX_PASSWORD_LENGTH,
    () => PASSWORD_REGEX.test(password),
    () => !COMMON_PASSWORDS.has(password.toLowerCase()),
    () => !/^(.)\1+$/.test(password),
  ];

  return checks.every(check => check());
}

export function isPasswordConfirmed(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}

export async function isPasswordPwned(password: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: AbortSignal.timeout(3000),
    });
    const text = await res.text();
    return text.includes(suffix);
  } catch (err) {
    console.error("Erreur HaveIBeenPwned:", err);
    return false;
  }
}

// ============ VALIDATION DIVERS ============
export function isRccmValid(rccm: string): boolean {
  const cleaned = rccm.trim().toUpperCase();
  return cleaned.length >= 5 
    && cleaned.length <= MAX_RCCM_LENGTH 
    && /^[A-Z0-9\/\-\.\s]+$/.test(cleaned);
}

export function isNameValid(name: string): boolean {
  const normalized = normalizeName(name);
  
  const checks = [
    () => normalized.length >= 2,
    () => !/[<>{}]/.test(normalized),
    () => !/[\u0000-\u001F\u007F]/.test(normalized),
    () => !/[\\$^*+?()[\]|]/.test(normalized),
  ];

  return checks.every(check => check());
}

export function isBioValid(bio: string): boolean {
  return bio.length <= MAX_BIO_LENGTH 
    && !/[<>{}]/.test(bio);
}

export function isCompanyNameValid(companyName: string): boolean {
  const normalized = normalizeName(companyName);
  
  const checks = [
    () => normalized.length >= 2,
    () => normalized.length <= MAX_COMPANY_NAME_LENGTH,
    () => !/[<>{}]/.test(normalized),
  ];

  return checks.every(check => check());
}

// ============ VALIDATION PAR ÉTAPES ============
type Step1Data = Pick<
  RegisterFormValues,
  | "name"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "acceptTerms"
  | "acceptLocation"
  | "acceptNoVpn"
  | "acceptVr"
>;

type Step2Data = Pick<
  RegisterFormValues,
  "role" | "clientType" | "companyName" | "rccmNumber" | "providerType" | "bio"
>;

export function validateStep1(data: Step1Data, content: ValidationContent): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const validations = [
    { condition: !isNameValid(data.name), key: "name", message: content.nameWarning?.value ?? "Le nom est requis (minimum 2 caractères)." },
    { condition: !isEmailValid(data.email), key: "email", message: content.emailWarning?.value ?? "Adresse email invalide." },
    { condition: !isPasswordValid(data.password), key: "password", message: content.passwordWarning?.value ?? `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères, une majuscule, un chiffre et un caractère spécial.` },
    { condition: !isPasswordConfirmed(data.password, data.confirmPassword), key: "confirmPassword", message: content.confirmPasswordWarning?.value ?? "Les mots de passe ne correspondent pas." },
    { condition: !data.acceptTerms, key: "acceptTerms", message: content.termsWarning?.value ?? "Vous devez accepter les conditions d'utilisation." },
    { condition: !data.acceptLocation, key: "acceptLocation", message: content.locationWarning?.value ?? "Vous devez accepter l'activation de la localisation." },
    { condition: !data.acceptNoVpn, key: "acceptNoVpn", message: content.noVpnWarning?.value ?? "Vous devez accepter de ne pas utiliser de VPN." },
    { condition: !data.acceptVr, key: "acceptVr", message: content.vrWarning?.value ?? "Vous devez accepter les conférences en VR." },
  ];

  if (!isPhoneValid(data.phone)) {
    errors.phone = content.phoneNumberWarning?.value ?? "Numéro de téléphone invalide. Veuillez inclure l'indicatif pays (ex: +225).";
  } else if (!isValidCountryCode(data.phone)) {
    errors.phone = content.phoneCountryCodeWarning?.value ?? "Indicatif pays invalide. Utilisez un format comme +225, +1, +44, +86.";
  }

  validations.forEach(({ condition, key, message }) => {
    if (condition) {
      errors[key as keyof RegisterFormErrors] = message;
    }
  });

  return errors;
}

export function validateStep2(data: Step2Data, content: ValidationContent): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (data.role === "CLIENT" && data.clientType === "AGENCY") {
    const agencyValidations = [
      { 
        condition: !isCompanyNameValid(data.companyName || ""), 
        key: "companyName", 
        message: content.companyNameWarning?.value ?? "Le nom de l'entreprise est requis." 
      },
      { 
        condition: !data.rccmNumber?.trim(), 
        key: "rccmNumber", 
        message: content.rccmNumberWarning?.value ?? "Le numéro RCCM est requis." 
      },
    ];

    agencyValidations.forEach(({ condition, key, message }) => {
      if (condition) {
        errors[key as keyof RegisterFormErrors] = message;
      }
    });

    if (data.rccmNumber?.trim() && !isRccmValid(data.rccmNumber)) {
      errors.rccmNumber = content.rccmFormatWarning?.value ?? "Format RCCM invalide.";
    }
  }

  if (data.role === "PROVIDER" && data.bio !== undefined && !isBioValid(data.bio)) {
    errors.bio = content.bioWarning?.value ?? "La bio doit contenir au maximum 500 caractères.";
  }

  return errors;
}

export function validateStep3(
  data: Pick<RegisterFormValues, "verificationMethod">,
  phoneProvided: boolean
): boolean {
  return !(data.verificationMethod === "phone" && !phoneProvided);
}

export function validateRegisterForm(
  form: RegisterFormValues,
  content: ValidationContent
): RegisterFormErrors {
  const step1Errors = validateStep1(form, content);
  const step2Errors = validateStep2(form, content);
  return { ...step1Errors, ...step2Errors };
}

export function hasErrors(errors: RegisterFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}