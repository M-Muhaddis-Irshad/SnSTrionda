import Image from "next/image";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import CartButton from "./cart/CartButton";
import AccountButton from "./AccountButton";
import NotificationBell from "./NotificationBell";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Men", href: "/shop/men" },
  { label: "Women", href: "/shop/women" },
  { label: "Clothing", href: "/shop/clothing" },
  { label: "New Arrivals", href: "/shop/new-arrivals" },
  { label: "Collections", href: "/shop/collections" },
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Left — Logo lockup */}
        <Link href="/" className="header-logo">
          <Image
            src="/logo/trionda-icon-mark.png"
            alt="Trionda Wears icon"
            width={40}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <span className="header-logo-text">
            TRIONDA WEARS
          </span>
        </Link>

        {/* Center — Desktop nav links */}
        <nav className="header-nav">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="header-nav-link"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — Icons + Mobile menu */}
        <div className="header-actions">
          <NotificationBell />

          <AccountButton />

          <button
            type="button"
            className="header-icon-btn"
            aria-label="Search"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>

          <CartButton />

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
