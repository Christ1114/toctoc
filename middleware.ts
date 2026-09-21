import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { locales } from "./config";
import { verifyValue } from "./components/utils/security-cookie";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "fr",
});

const SECURED_ROUTES = ["/preloading", "/settings", "/app"];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/precheck",
];

const SECURITY_CHECK_MAX_AGE = 30 * 60 * 1000;

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
  const locale = localeMatch ? localeMatch[1] : "fr";

  const pathWithoutLocale = pathname.replace(/^\/(en|fr|zh|ar)(?:\/|$)/, "/");

  const isApiRoute =
    pathWithoutLocale === "/api" || pathWithoutLocale.startsWith("/api/");

  if (isApiRoute) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathWithoutLocale === route ||
      (route !== "/" && pathWithoutLocale.startsWith(route + "/"))
  );

  const isSecuredRoute = SECURED_ROUTES.some(
    (route) =>
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
  const secret = process.env.SECURITY_CHECK_SECRET;
  const raw = request.cookies.get("security_check_passed")?.value;
  const timestamp = secret && raw ? await verifyValue(raw, secret) : null;
  const age = timestamp ? Date.now() - parseInt(timestamp) : NaN;

  if (!timestamp || isNaN(age) || age > SECURITY_CHECK_MAX_AGE) {
    const precheckUrl = new URL(`/${locale}/precheck`, request.url);
    precheckUrl.searchParams.set("callbackUrl", pathname);
    precheckUrl.searchParams.set("reason", timestamp ? "expired" : "missing");
    return NextResponse.redirect(precheckUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};