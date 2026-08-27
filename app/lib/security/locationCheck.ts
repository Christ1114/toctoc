
const IVORY_COAST_BOUNDS = {
    minLat: 4.1,
    maxLat: 10.8,
    minLng: -8.6,
    maxLng: -2.5,
  } as const;
  

  const IVORY_COAST_POLYGON = [
    { lat: 4.1, lng: -8.6 },   // Sud-Ouest (Tabou)
    { lat: 4.4, lng: -7.5 },   // Sud (San-Pédro)
    { lat: 5.2, lng: -3.5 },   // Sud-Est (Abidjan)
    { lat: 5.0, lng: -2.5 },   // Extrême Sud-Est
    { lat: 6.5, lng: -2.5 },   // Est
    { lat: 8.0, lng: -2.5 },   // Nord-Est
    { lat: 10.8, lng: -4.5 },  // Nord
    { lat: 10.5, lng: -6.5 },  // Nord-Ouest
    { lat: 8.5, lng: -8.6 },   // Ouest (Man)
    { lat: 6.5, lng: -8.6 },   // Sud-Ouest
  ] as const;
  
  const EARTH_RADIUS_KM = 6371;
  

  export interface LocationCheckResult {
    isValid: boolean;
    reason?: string;
    distanceToBorder?: number;
    region?: string;
  }
  
  export interface RegionInfo {
    name: string;
    isServiceAvailable: boolean;
    centerLat: number;
    centerLng: number;
  }
  
  // ============ CACHE ============
  const locationCache = new Map<string, { result: LocationCheckResult; timestamp: number }>();
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  const MAX_CACHE_SIZE = 1000;
  

  const REGIONS: Record<string, RegionInfo> = {
    "ABIDJAN": { 
      name: "Abidjan", 
      isServiceAvailable: true, 
      centerLat: 5.3599, 
      centerLng: -4.0083 
    },
    "YAMOUSSOUKRO": { 
      name: "Yamoussoukro", 
      isServiceAvailable: true, 
      centerLat: 6.8276, 
      centerLng: -5.2893 
    },
    "BOUAKE": { 
      name: "Bouaké", 
      isServiceAvailable: true, 
      centerLat: 7.6905, 
      centerLng: -5.0301 
    },
    "SAN-PEDRO": { 
      name: "San-Pédro", 
      isServiceAvailable: true, 
      centerLat: 4.7485, 
      centerLng: -6.6363 
    },
    "KORHOGO": { 
      name: "Korhogo", 
      isServiceAvailable: true, 
      centerLat: 9.4580, 
      centerLng: -5.6290 
    },
    "MAN": { 
      name: "Man", 
      isServiceAvailable: true, 
      centerLat: 7.4125, 
      centerLng: -7.5538 
    },
    "DALOA": { 
      name: "Daloa", 
      isServiceAvailable: true, 
      centerLat: 6.8774, 
      centerLng: -6.4502 
    },
  };
 
  
  /**
   * Valide si une localisation est en Côte d'Ivoire
   * @param lat Latitude
   * @param lng Longitude
   * @param options Options de validation
   * @returns Résultat de la validation
   */
  export function validateLocation(
    lat: number, 
    lng: number,
    options?: {
      toleranceKm?: number;        // Tolérance en km pour les zones frontalières
      usePolygon?: boolean;        // Utiliser la validation par polygone
      checkRegion?: boolean;       // Vérifier la région
      useCache?: boolean;          // Utiliser le cache
    }
  ): LocationCheckResult {
    // Validation des entrées
    if (!isValidCoordinate(lat, lng)) {
      return { 
        isValid: false, 
        reason: "coordonnees-invalides" 
      };
    }
  
   
    if (options?.useCache !== false) {
      const cachedResult = getCachedResult(lat, lng);
      if (cachedResult) {
        return cachedResult;
      }
    }
  
    const toleranceKm = options?.toleranceKm ?? 0;
    
   
    const withinBounds = isWithinBounds(lat, lng, toleranceKm);
    
    if (!withinBounds) {
      const result: LocationCheckResult = {
        isValid: false, 
        reason: "hors-zone-couverte",
        distanceToBorder: calculateDistanceToBorder(lat, lng)
      };
      
      cacheResult(lat, lng, result);
      return result;
    }
  
    
    if (options?.usePolygon === true) {
      const withinPolygon = isPointInPolygon(lat, lng, IVORY_COAST_POLYGON);
      if (!withinPolygon) {
        const result: LocationCheckResult = {
          isValid: false, 
          reason: "hors-frontieres-precises",
          distanceToBorder: calculateDistanceToBorder(lat, lng)
        };
        
        cacheResult(lat, lng, result);
        return result;
      }
    }
  
  
    let region: string | undefined;
    if (options?.checkRegion === true) {
      region = findNearestRegion(lat, lng);
    }
  
    const result: LocationCheckResult = {
      isValid: true,
      distanceToBorder: calculateDistanceToBorder(lat, lng),
      region
    };
  
    cacheResult(lat, lng, result);
    return result;
  }
  
 
  export function validateLocationWithMinimumDistance(
    lat: number, 
    lng: number, 
    minDistanceFromBorderKm: number = 5
  ): LocationCheckResult {
    const baseValidation = validateLocation(lat, lng);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }
    
    const distanceToBorder = baseValidation.distanceToBorder ?? calculateDistanceToBorder(lat, lng);
    
    if (distanceToBorder < minDistanceFromBorderKm) {
      return {
        isValid: false,
        reason: "trop-proche-frontiere",
        distanceToBorder
      };
    }
    
    return {
      ...baseValidation,
      distanceToBorder
    };
  }
  
 
  function isValidCoordinate(lat: number, lng: number): boolean {
   
    if (typeof lat !== "number" || typeof lng !== "number") {
      return false;
    }
    
 
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return false;
    }
    
   
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
    
    return true;
  }
  
  
  function isWithinBounds(lat: number, lng: number, toleranceKm: number = 0): boolean {
    if (toleranceKm === 0) {
      return (
        lat >= IVORY_COAST_BOUNDS.minLat &&
        lat <= IVORY_COAST_BOUNDS.maxLat &&
        lng >= IVORY_COAST_BOUNDS.minLng &&
        lng <= IVORY_COAST_BOUNDS.maxLng
      );
    }
    

    const latTolerance = toleranceKm / 111;
    const lngTolerance = toleranceKm / (111 * Math.cos(lat * Math.PI / 180));
    
    return (
      lat >= IVORY_COAST_BOUNDS.minLat - latTolerance &&
      lat <= IVORY_COAST_BOUNDS.maxLat + latTolerance &&
      lng >= IVORY_COAST_BOUNDS.minLng - lngTolerance &&
      lng <= IVORY_COAST_BOUNDS.maxLng + lngTolerance
    );
  }
  

  function calculateDistanceToBorder(lat: number, lng: number): number {
    const centerLat = (IVORY_COAST_BOUNDS.minLat + IVORY_COAST_BOUNDS.maxLat) / 2;
    const centerLng = (IVORY_COAST_BOUNDS.minLng + IVORY_COAST_BOUNDS.maxLng) / 2;
    
    return calculateHaversineDistance(lat, lng, centerLat, centerLng);
  }
  
  
  function calculateHaversineDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return EARTH_RADIUS_KM * c;
  }

  function isPointInPolygon(
    lat: number, 
    lng: number, 
    polygon: readonly { lat: number; lng: number }[]
  ): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;
      
      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
 
  function findNearestRegion(lat: number, lng: number): string | undefined {
    let nearestRegion: string | undefined;
    let minDistance = Infinity;
    
    for (const [regionKey, regionInfo] of Object.entries(REGIONS)) {
      const distance = calculateHaversineDistance(
        lat, 
        lng, 
        regionInfo.centerLat, 
        regionInfo.centerLng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestRegion = regionInfo.name;
      }
    }
    
    return nearestRegion;
  }
  
  function getCachedResult(lat: number, lng: number): LocationCheckResult | null {
 
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    const cacheKey = `${roundedLat},${roundedLng}`;
    
    const cached = locationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
    
    return null;
  }
  

  function cacheResult(lat: number, lng: number, result: LocationCheckResult): void {
   
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    const cacheKey = `${roundedLat},${roundedLng}`;
    
    
    if (locationCache.size >= MAX_CACHE_SIZE) {
      const oldestTime = Date.now() - CACHE_TTL;
      for (const [key, value] of locationCache) {
        if (value.timestamp < oldestTime) {
          locationCache.delete(key);
        }
      }
    }
    
    locationCache.set(cacheKey, { result, timestamp: Date.now() });
  }
  
  
  export function getRegionInfo(regionName: string): RegionInfo | undefined {
    const regionKey = Object.keys(REGIONS).find(
      key => REGIONS[key].name.toUpperCase() === regionName.toUpperCase()
    );
    
    return regionKey ? REGIONS[regionKey] : undefined;
  }
  
  
  export function isRegionAvailable(regionName: string): boolean {
    const region = getRegionInfo(regionName);
    return region?.isServiceAvailable ?? false;
  }
  

  export { IVORY_COAST_BOUNDS, REGIONS };