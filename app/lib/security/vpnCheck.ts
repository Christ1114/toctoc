// app/lib/security/vpnCheck.ts
import { NextRequest } from "next/server";

interface VpnCheckResult {
  isVpn: boolean;
  provider?: string;
  country?: string;
  timezone?: string;
  confidence?: number;
  details: {
    ipwhois?: any;
    ipapi?: any;
    ipquality?: any;
    error?: string; // ← Ajoutez "error" comme propriété optionnelle
  };
}

const KNOWN_VPN_PROVIDERS = [
  'cyberghost',
  'cyberghostvpn',
  'nordvpn',
  'expressvpn',
  'surfshark',
  'protonvpn',
  'privateinternetaccess',
  'ipvanish',
  'hotspotshield',
  'tunnelbear',
  'vyprvpn',
  'windscribe',
  'hideMyAss',
  'purevpn',
  'mullvad',
  'atlasvpn',
];

const ALLOWED_COUNTRIES = ['CI'];
const EXPECTED_TIMEZONE = 'Africa/Abidjan';

export async function checkVpnStatus(headers: Headers): Promise<VpnCheckResult> {
  const ip = getClientIp(headers);
  
  if (!ip || ip === 'unknown') {
    return {
      isVpn: false,
      confidence: 0,
      details: { error: 'IP non détectable' }
    };
  }

  const [ipwhoisResult, ipapiResult, ipqualityResult] = await Promise.allSettled([
    checkWithIpwhois(ip),
    checkWithIpapi(ip),
    checkWithIpQuality(ip),
  ]);

  const results = {
    ipwhois: ipwhoisResult.status === 'fulfilled' ? ipwhoisResult.value : null,
    ipapi: ipapiResult.status === 'fulfilled' ? ipapiResult.value : null,
    ipquality: ipqualityResult.status === 'fulfilled' ? ipqualityResult.value : null,
  };

  const vpnIndicators = [
    results.ipwhois?.isVpn,
    results.ipapi?.isVpn,
    results.ipquality?.isVpn,
  ].filter(Boolean).length;

  const proxyIndicators = [
    results.ipwhois?.isProxy,
    results.ipapi?.isProxy,
    results.ipquality?.isProxy,
  ].filter(Boolean).length;

  const torIndicators = [
    results.ipwhois?.isTor,
    results.ipapi?.isTor,
    results.ipquality?.isTor,
  ].filter(Boolean).length;

  const provider = detectProvider(results);

  const country = results.ipwhois?.country || results.ipapi?.country || results.ipquality?.country;
  const isAllowedCountry = country ? ALLOWED_COUNTRIES.includes(country) : true;

  const timezone = results.ipwhois?.timezone || results.ipapi?.timezone;
  const timezoneMismatch = timezone && timezone !== EXPECTED_TIMEZONE;

  let confidence = Math.min(
    100,
    (vpnIndicators * 40) + (proxyIndicators * 30) + (torIndicators * 30)
  );

  if (!isAllowedCountry) {
    confidence += 50;
  }

  if (timezoneMismatch) {
    confidence += 30;
  }

  confidence = Math.min(100, confidence);

  const isVpn = vpnIndicators > 0 || 
                proxyIndicators > 0 || 
                torIndicators > 0 || 
                !isAllowedCountry ||
                timezoneMismatch;

  return {
    isVpn,
    provider: provider || undefined, // ← Convertir null en undefined
    country,
    timezone,
    confidence,
    details: results,
  };
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  
  return headers.get("x-forwarded") || 'unknown';
}

async function checkWithIpwhois(ip: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://ipwho.is/${ip}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    
    return {
      isVpn: data.security?.vpn || false,
      isProxy: data.security?.proxy || false,
      isTor: data.security?.tor || false,
      country: data.country_code,
      timezone: data.timezone?.id,
      provider: data.connection?.org,
      type: data.connection?.type,
    };
  } catch (error) {
    return { isVpn: false, isProxy: false, isTor: false };
  }
}

async function checkWithIpapi(ip: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    
    return {
      isVpn: data.security?.vpn || false,
      isProxy: data.security?.proxy || false,
      isTor: data.security?.tor || false,
      country: data.country_code,
      timezone: data.timezone,
      provider: data.org,
    };
  } catch (error) {
    return { isVpn: false, isProxy: false, isTor: false };
  }
}

async function checkWithIpQuality(ip: string) {
  const apiKey = process.env.IPQUALITYSCORE_API_KEY;
  if (!apiKey) return { isVpn: false, isProxy: false, isTor: false };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${ip}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await response.json();
    
    return {
      isVpn: data.vpn || false,
      isProxy: data.proxy || false,
      isTor: data.tor || false,
      country: data.country_code,
      provider: data.isp,
      fraudScore: data.fraud_score,
      activeVpn: data.active_vpn,
    };
  } catch (error) {
    return { isVpn: false, isProxy: false, isTor: false };
  }
}

function detectProvider(results: any): string | null {
  const allData = JSON.stringify(results).toLowerCase();
  
  for (const provider of KNOWN_VPN_PROVIDERS) {
    if (allData.includes(provider)) {
      return provider;
    }
  }
  
  const providers = [
    results.ipwhois?.provider,
    results.ipapi?.provider,
    results.ipquality?.provider,
  ].filter(Boolean);

  for (const provider of providers) {
    const normalized = provider.toLowerCase();
    if (KNOWN_VPN_PROVIDERS.some(vpn => normalized.includes(vpn))) {
      return provider;
    }
  }
  
  return null;
}