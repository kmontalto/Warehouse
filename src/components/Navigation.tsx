"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/schedule", label: "Schedule" },
    { href: "/roster", label: "Roster" },
    { href: "/practice-plans", label: "Practice Plans" },
    { href: "/messages", label: "Messages" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-primary-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Branding */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-md bg-accent flex items-center justify-center">
                <span className="text-primary-dark font-extrabold text-lg leading-none">W</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-white font-bold text-base tracking-tight">
                  WSA Warriors
                </span>
                <span className="text-accent text-[10px] font-semibold tracking-widest uppercase">
                  10U Command Center
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-white"
                    : "text-red-200 hover:bg-primary hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth section - desktop */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {user ? (
              <>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-primary-dark">
                  Coach Mode
                </span>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-primary text-white"
                      : "text-red-200 hover:bg-primary hover:text-white"
                  }`}
                >
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-red-200 hover:bg-primary hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-accent hover:bg-primary hover:text-accent-light transition-colors"
              >
                Coach Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-red-200 hover:text-white hover:bg-primary focus:outline-none"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary-dark text-white"
                    : "text-red-100 hover:bg-primary-dark hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-primary-dark pt-2 mt-2">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-primary-dark">
                      Coach Mode
                    </span>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-primary-dark hover:text-white"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-primary-dark hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-accent hover:bg-primary-dark hover:text-accent-light"
                >
                  Coach Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
