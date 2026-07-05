import createMiddleware from "next-intl/middleware";
import {locales} from "./config";


export default createMiddleware({ locales, defaultLocale:'fr'});

export const config= {
    matcher: ["/", "/(en|fr|zh|ar)/:path*"],
}