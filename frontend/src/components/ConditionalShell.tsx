'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const AUTH_ROUTES = ['/login', '/signup', '/register', '/admin/login'];
const ADMIN_ROUTES = ['/admin'];

// Admin dashboard has its own sidebar shell — never render the storefront
// header/footer (or the admin login page's chrome) on admin routes.
const HIDDEN_SHELL_ROUTES = [...AUTH_ROUTES, ...ADMIN_ROUTES];

export default function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShellHidden = HIDDEN_SHELL_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <>
      {!isShellHidden && <Header />}
      {children}
      {!isShellHidden && <Footer />}
    </>
  );
}
