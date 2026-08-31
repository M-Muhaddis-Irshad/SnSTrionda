import Image from "next/image";
import MobileMenu from "./MobileMenu";
import CartButton from "./cart/CartButton";
import AccountButton from "./AccountButton";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/shop" },
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full bg-surface border-b border-chrome-500">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left — Logo lockup */}
        <a href="/" className="flex items-center gap-3 shrink-0">
          <Image
            src="/logo/trionda-icon-mark.png"
            alt="Trionda Wears icon"
            width={40}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <span className="font-display text-lg tracking-[0.2em] text-foreground hidden sm:inline">
            TRIONDA WEARS
          </span>
        </a>

        {/* Center — Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-body tracking-wide text-muted transition-colors duration-200 hover:text-chrome-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — Icons + Mobile menu */}
        <div className="flex items-center gap-3">
          {/* Account icon */}
          <AccountButton />

          {/* Search icon */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chrome-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

          {/* Cart / Bag icon + badge + drawer */}
          <CartButton />

          {/* Mobile menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
