'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Folder,
  Palette,
  Star,
  Image,
  Tag,
  Mail,
  Ticket,
  Settings,
  Truck,
  LogOut,
  MessageSquare,
  Activity,
  PanelsTopLeft,
  BookOpen,
  UserRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAuthHydrated } from '@/lib/useAuthHydrated';

const NAV_ITEMS = [
  { section: 'Main', items: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Management', items: [
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/products', label: 'Products', icon: ShoppingBag },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/categories', label: 'Categories', icon: Folder },
    { href: '/admin/collections', label: 'Collections', icon: Palette },
    { href: '/admin/reviews', label: 'Reviews', icon: Star },
  ]},
  { section: 'Content', items: [
    { href: '/admin/landing', label: 'Landing Page', icon: PanelsTopLeft },
    { href: '/admin/brand-story', label: 'Brand Story', icon: BookOpen },
    { href: '/admin/media', label: 'Media & Campaigns', icon: Image },
  ]},
  { section: 'Realtime', items: [
    { href: '/admin/chat', label: 'Live Chat', icon: MessageSquare },
    { href: '/admin/activity', label: 'Activity Log', icon: Activity },
  ]},
  { section: 'Marketing', items: [
    { href: '/admin/discounts', label: 'Discounts', icon: Tag },
    { href: '/admin/campaigns', label: 'Email Campaigns', icon: Mail },
    { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  ]},
  { section: 'Delivery', items: [
    { href: '/admin/delivery', label: 'Delivery Zones', icon: Truck },
  ]},
  { section: 'Settings', items: [
    { href: '/admin/settings', label: 'Store Settings', icon: Settings },
    { href: '/admin/profile', label: 'My Profile', icon: UserRound },
  ]},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, clearAuth } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Derive page title from pathname
  const getPageTitle = () => {
    const seg = pathname.replace('/admin', '').replace(/^\//, '');
    if (!seg) return 'Dashboard';
    const map: Record<string, string> = {
      orders: 'Orders',
      products: 'Products',
      customers: 'Customers',
      categories: 'Categories',
      collections: 'Collections',
      reviews: 'Reviews',
      landing: 'Landing Page',
      'brand-story': 'Brand Story',
      media: 'Media & Campaigns',
      chat: 'Live Chat',
      activity: 'Activity Log',
      discounts: 'Discounts',
      campaigns: 'Email Campaigns',
      coupons: 'Coupons',
      delivery: 'Delivery Zones',
      settings: 'Store Settings',
      profile: 'My Profile',
      users: 'Users',
    };
    // Handle nested routes like /admin/orders/123
    const base = seg.split('/')[0];
    return map[base] || base.charAt(0).toUpperCase() + base.slice(1);
  };
  const pageTitle = getPageTitle();
  const authHydrated = useAuthHydrated();

  const isAuthenticated = !!accessToken && !!user;
  const isAdmin = user?.role === 'ADMIN';

  // Guard against redirecting on a stale render. Zustand rehydrates the
  // persisted session asynchronously, and an effect queued by an early render
  // can fire with isAuthenticated=false even though the store already holds a
  // valid session by the time the effect runs. Decide from a fresh store read.
  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!authHydrated) return; // wait for persisted auth before deciding
    const st = useAuthStore.getState();
    const authed = !!st.accessToken && !!st.user;
    const admin = st.user?.role === 'ADMIN';
    if (!authed || !admin) {
      router.replace('/login');
    }
  }, [pathname, isAuthenticated, isAdmin, authHydrated, router]);

  // Login page renders without the admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Wait for persisted auth to rehydrate on hard refreshes before deciding
  // anything — otherwise a fresh /admin load briefly looks logged-out and
  // wrongly bounces the user to /login.
  if (!authHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated or not an admin — hold content until the effect above
  // redirects (never redirect during render).
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-gray-800
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:sticky lg:top-0 lg:h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-800">
            <h1 className="text-white font-serif text-xl">Trionda Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
            {NAV_ITEMS.map((group) => (
              <div key={group.section}>
                <p className="text-xs uppercase text-gray-500 font-bold mb-4 px-3">
                  {group.section}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded text-sm transition
                          ${isActive
                            ? 'bg-gray-900 text-white border-l-2 border-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-900'
                          }
                        `}
                      >
                        <span className="flex items-center justify-center w-5">
                          <item.icon size={18} strokeWidth={1.75} />
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-800 px-4 py-4">
            <Link href="/admin/profile" className="flex items-center gap-3 px-3 hover:opacity-80 transition">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user?.name || 'Admin'}
                  className="w-10 h-10 rounded-full object-cover border border-gray-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </div>
              )}
              <div>
                <p className="text-sm text-white">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">super_admin</p>
              </div>
            </Link>
            <button
              onClick={() => { clearAuth(); router.push('/login'); }}
              className="w-full mt-3 py-2 text-gray-400 hover:text-white text-sm text-left px-3 transition flex items-center gap-3"
            >
              <LogOut size={18} strokeWidth={1.75} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-black border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition p-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-white text-sm font-semibold">{pageTitle}</span>
          <div className="w-8" />
        </header>

        {/* Desktop header */}
        <div className="hidden lg:flex bg-black border-b border-gray-800 px-8 py-4 items-center justify-between">
          <h1 className="text-white text-2xl font-semibold">{pageTitle}</h1>
          <div className="flex items-center gap-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchQuery.trim().toLowerCase();
                if (!q) return;
                // Navigate to the most relevant admin page based on search
                if (/order|trd/.test(q)) router.push(`/admin/orders?search=${encodeURIComponent(q)}`);
                else if (/product|shirt|sherwani/.test(q)) router.push(`/admin/products?search=${encodeURIComponent(q)}`);
                else if (/customer|user|account/.test(q)) router.push(`/admin/customers?search=${encodeURIComponent(q)}`);
                else if (/coupon|promo|discount/.test(q)) router.push(`/admin/coupons?search=${encodeURIComponent(q)}`);
                else if (/category|collection/.test(q)) router.push(`/admin/categories?search=${encodeURIComponent(q)}`);
                else if (/chat|message|support/.test(q)) router.push(`/admin/chat?search=${encodeURIComponent(q)}`);
                else router.push(`/admin/orders?search=${encodeURIComponent(q)}`);
                setSearchQuery("");
              }}
              className="flex items-center"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, products..."
                className="bg-gray-900 text-white text-sm px-4 py-2 rounded-l border border-gray-800 focus:outline-none focus:border-gray-600 w-48"
              />
              <button
                type="submit"
                className="bg-gray-800 text-gray-400 hover:text-white px-3 py-2.5 rounded-r border border-l-0 border-gray-800 transition-colors"
                title="Search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </button>
            </form>
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user?.name || 'Admin'}
                className="w-8 h-8 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
