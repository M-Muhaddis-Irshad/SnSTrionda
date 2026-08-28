import Image from "next/image";
import MobileMenu from "./MobileMenu";

const navLinks = [
  { label: "Shop", href: "#" },
  { label: "Collections", href: "#" },
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
              className="text-sm font-body tracking-wide text-muted transition-colors duration-200 hover:text-chrome-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right — Icons + Mobile menu */}
        <div className="flex items-center gap-3">
          {/* Search icon */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-muted transition-colors duration-200 hover:text-foreground"
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

          {/* Cart / Bag icon */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center text-muted transition-colors duration-200 hover:text-foreground"
            aria-label="Cart"
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
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </button>

          {/* Mobile menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
