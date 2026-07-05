import { createNavigation } from 'next-intl/navigation';

export const { useRouter, usePathname, Link, redirect } = createNavigation({
    locales: ['fr', 'en', 'ar', 'zh']
});