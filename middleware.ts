
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { locales } from "./config";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'fr'
});


const SECURED_ROUTES = [
  "/preloading",
  "/dashboard",
  "/profile",
  "/settings",
];


const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/precheck",
];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
 
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
 
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  
 
  const localeMatch = pathname.match(/^\/(en|fr|zh|ar)(?:\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'fr';
  
 
  const pathWithoutLocale = pathname.replace(/^\/(en|fr|zh|ar)(?:\/|$)/, '/');
  
  
  const isApiRoute = pathWithoutLocale === "/api" || pathWithoutLocale.startsWith("/api/");
  
  if (isApiRoute) {
   
    const homeUrl = new URL(`/${locale}`, request.url);
    return NextResponse.redirect(homeUrl);
  }
  
 
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathWithoutLocale === route || 
    (route !== "/" && pathWithoutLocale.startsWith(route + "/"))
  );
  

  const isSecuredRoute = SECURED_ROUTES.some(route => 
    pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/")
  );
  
  
  if (!isPublicRoute && !isSecuredRoute && pathWithoutLocale !== "/") {
   
    return intlMiddleware(request);
  }
  
 
  if (isPublicRoute) {
    return intlMiddleware(request);
  }
  
 
  const sessionCookie = getSessionCookie(request);
  
  if (!sessionCookie) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  
  if (isSecuredRoute) {
    const securityCheckPassed = request.cookies.get("security_check_passed");
    const securityCheckTimestamp = request.cookies.get("security_check_timestamp");
    
    if (!securityCheckPassed || securityCheckPassed.value !== "true") {
      const precheckUrl = new URL(`/${locale}/precheck`, request.url);
      precheckUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(precheckUrl);
    }
    
    if (securityCheckTimestamp) {
      const checkTime = parseInt(securityCheckTimestamp.value);
      const now = Date.now();
      const maxAge = 30 * 60 * 1000;
      
      if (now - checkTime > maxAge) {
        const precheckUrl = new URL(`/${locale}/precheck`, request.url);
        precheckUrl.searchParams.set("callbackUrl", pathname);
        precheckUrl.searchParams.set("expired", "true");
        return NextResponse.redirect(precheckUrl);
      }
    }
  }
  
  
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};