"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Explore funding", href: "/explore" },
  { label: "Profile", href: "/profile" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav style={{ color: "var(--color-text-label)" }} className="w-full py-5 px-6 md:px-10">
      <div className="max-w-[1100px] mx-auto flex items-center justify-between md:justify-end">
        {/* Mobile: wordmark left */}
        <Link
          href="/"
          className="md:hidden font-normal no-underline"
          style={{
            fontFamily: "Georgia, serif",
            color: "var(--color-text-primary)",
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          GrantMatch
        </Link>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{ color: "var(--color-text-label)" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            {menuOpen ? (
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 6h14M3 10h14M3 14h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  color: active ? "var(--color-text-primary)" : "var(--color-text-label)",
                  textDecoration: "none",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                }}
                className="hover:opacity-80 transition-opacity"
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden mt-3 flex flex-col gap-4 px-6 pb-4"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm py-1 no-underline"
              style={{
                color: "var(--color-text-label)",
                textDecoration: "none",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
