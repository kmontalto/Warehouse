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
    <nav className="bg-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Branding */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-yellow-400 font-bold text-xl tracking-tight">
                Warehouse 10U
              </span>
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
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-800 hover:text-white"
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
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-blue-900">
                  Coach Mode
                </span>
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-blue-700 text-white"
                      : "text-blue-100 hover:bg-blue-800 hover:text-white"
                  }`}
                >
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-yellow-400 hover:bg-blue-800 hover:text-yellow-300 transition-colors"
              >
                Coach Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800 focus:outline-none"
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
        <div className="md:hidden bg-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-blue-700 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-blue-700 pt-2 mt-2">
              {user ? (
                <>
                  <div className="px-3 py-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400 text-blue-900">
                      Coach Mode
                    </span>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                  >
                    Admin
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-yellow-400 hover:bg-blue-700 hover:text-yellow-300"
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
