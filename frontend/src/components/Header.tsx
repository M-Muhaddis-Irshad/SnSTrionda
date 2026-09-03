import Image from "next/image";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import CartButton from "./cart/CartButton";
import AccountButton from "./AccountButton";
import NotificationBell from "./NotificationBell";
import SearchButton from "./search/SearchButton";

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
            width={60}
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

          <SearchButton />

          <CartButton />

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
