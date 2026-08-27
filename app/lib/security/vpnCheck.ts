export interface VpnCheckResult {
    isVpn: boolean;
    reason?: string;
  }
  
  const vpnCache = new Map<string, { result: VpnCheckResult; timestamp: number }>();
  const CACHE_TTL = 5 * 60 * 1000; 
  const API_TIMEOUT = 4000;
  
  function getClientIp(headers: Headers): string | null {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      const firstIp = forwarded.split(",")[0].trim();
      return isValidIp(firstIp) ? firstIp : null;
    }
    
    const realIp = headers.get("x-real-ip");
    return realIp && isValidIp(realIp) ? realIp : null;
  }
  
  function isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    
    if (ipv4Regex.test(ip)) {
      return ip.split('.').every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    return ipv6Regex.test(ip);
  }
  
  function isLocalIp(ip: string): boolean {
    return ip === "::1" || 
           ip === "127.0.0.1" || 
           ip.startsWith("10.") || 
           ip.startsWith("192.168.") ||
           ip.startsWith("172.16.");
  }
  
  function getCachedResult(ip: string): VpnCheckResult | null {
    const cached = vpnCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }

    if (vpnCache.size > 1000) {
      const oldestTime = Date.now() - CACHE_TTL;
      for (const [key, value] of vpnCache) {
        if (value.timestamp < oldestTime) {
          vpnCache.delete(key);
        }
      }
    }
    
    return null;
  }
  
  export async function checkVpnStatus(headers: Headers): Promise<VpnCheckResult> {
    const ip = getClientIp(headers);
  
    if (!ip) {
      return { isVpn: false, reason: "IP invalide ou introuvable" };
    }
  
    if (isLocalIp(ip)) {
      return { isVpn: false, reason: "dev-local" };
    }
  
    const cachedResult = getCachedResult(ip);
    if (cachedResult) {
      return cachedResult;
    }
  
    const apiKey = process.env.VPNAPI_KEY;
    if (!apiKey) {
      console.error("VPNAPI_KEY non définie");
      return { isVpn: false, reason: "service-indisponible" };
    }
  
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
      const res = await fetch(`https://vpnapi.io/api/${ip}?key=${apiKey}`, {
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (!res.ok) {
        console.error("Erreur vpnapi.io:", res.status);
        return { isVpn: false, reason: "verification-echouee" };
      }
  
      const data = await res.json();
      const isVpn = Boolean(
        data?.security?.vpn || 
        data?.security?.proxy || 
        data?.security?.tor || 
        data?.security?.relay
      );
  
      const result = { isVpn };
      
      
      vpnCache.set(ip, { result, timestamp: Date.now() });
      
      return result;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error("Timeout détection VPN");
        return { isVpn: false, reason: "timeout" };
      }
      
      console.error("Erreur détection VPN:", err);
      return { isVpn: false, reason: "timeout" };
    }
  }