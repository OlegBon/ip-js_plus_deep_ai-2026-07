'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/admin', label: 'Admin' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' },
  ];

  return (
    <header className="bg-white border-border sticky top-0 z-50 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-accent text-lg font-bold">
            Convertly Hub
          </Link>
          <nav className="hidden items-center space-x-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-indigo-600'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center space-x-4 md:flex">
          <Link
            href="/login"
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-900"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-text-primary border-border rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
          >
            Sign Up
          </Link>
          <button className="text-text-primary border-border rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100">
            Log Out
          </button>
        </div>
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-text-primary">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="bg-white border-border border-t md:hidden">
          <nav className="flex flex-col space-y-4 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  pathname === link.href
                    ? 'text-indigo-600'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={toggleMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-4 pt-4">
              <Link
                href="/login"
                className="flex-1 rounded-md bg-gray-800 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-gray-900"
                onClick={toggleMobileMenu}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-text-primary border-border flex-1 rounded-md border px-4 py-2 text-center text-sm font-medium transition-colors hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Sign Up
              </Link>
              <button
                className="text-text-primary border-border w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Log Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
