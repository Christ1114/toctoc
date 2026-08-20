export type Operator = "ORANGE" | "MOOV" | "MTN" | "UNKNOWN";
export function detectIvorianOperator(phoneNumber: string): Operator {
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  const isIvorian = cleaned.startsWith("225") || phoneNumber.startsWith("+225");
  if (!isIvorian) return "UNKNOWN";
  
  const localNumber = cleaned.startsWith("225") ? cleaned.slice(3) : cleaned;
  if (localNumber.length !== 10) return "UNKNOWN";
  
  const prefix = localNumber.slice(0, 2);
  
  if (prefix === "05") return "MTN";
  if (prefix === "07") return "ORANGE";
  if (prefix === "01") return "MOOV";
  
  return "UNKNOWN";
}

export interface NumVerifyResponse {
  valid: boolean;
  number: string;
  local_format: string;
  international_format: string;
  country_prefix: string;
  country_code: string;
  country_name: string;
  location: string;
  carrier: string;
  line_type: string;
}

export async function verifyWithNumVerify(phoneNumber: string): Promise<NumVerifyResponse | null> {
  const apiKey = process.env.NUMVERIFY_API_KEY;
  if (!apiKey) {
    console.warn("NUMVERIFY_API_KEY non définie, NumVerify désactivé");
    return null;
  }

  const cleaned = phoneNumber.replace(/\D/g, "");
  
  try {
    const res = await fetch(
      `https://apilayer.net/api/validate?access_key=${apiKey}&number=${cleaned}&country_code=CI&format=1`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!res.ok) {
      console.error("Erreur NumVerify:", res.status);
      return null;
    }
    
    const data: NumVerifyResponse = await res.json();
    return data;
  } catch (err) {
    console.error("Erreur NumVerify:", err);
    return null;
  }
}

export async function detectOperatorWithNumVerify(phoneNumber: string): Promise<Operator> {
  const result = await verifyWithNumVerify(phoneNumber);
  
  if (!result || !result.valid) return "UNKNOWN";
  
  const carrier = result.carrier.toLowerCase();
  
  if (carrier.includes("mtn")) return "MTN";
  if (carrier.includes("orange")) return "ORANGE";
  if (carrier.includes("moov")) return "MOOV";
  
  return "UNKNOWN";
}


export async function detectOperator(phoneNumber: string): Promise<Operator> {
  
  const localDetection = detectIvorianOperator(phoneNumber);
  if (localDetection !== "UNKNOWN") {
    return localDetection;
  }
  
  
  const numVerifyDetection = await detectOperatorWithNumVerify(phoneNumber);
  if (numVerifyDetection !== "UNKNOWN") {
    return numVerifyDetection;
  }
  
  return "UNKNOWN";
}

export function isIvorianNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");
  return cleaned.startsWith("225") || phoneNumber.startsWith("+225");
}

export function normalizeIvorianNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  if (cleaned.startsWith("225")) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `+225${cleaned}`;
  }
  
  return phoneNumber;
}