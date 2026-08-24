'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
    await signOut({ callbackUrl: '/' });
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/management', label: 'Admin' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/docs', label: 'Docs' },
  ];

  return (
    <header className="bg-white border-border sticky top-0 z-50 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-accent text-lg font-bold">
          Convertly Hub
        </Link>
        <div className="hidden items-center space-x-6 md:flex">
          <nav className="flex items-center space-x-6">
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
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button variant="secondary" onClick={handleLogout}>
                Log Out
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
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
              {isAuthenticated ? (
                <Button variant="secondary" onClick={handleLogout}>
                  Log Out
                </Button>
              ) : (
                <>
                  <Button asChild>
                    <Link href="/login" onClick={toggleMobileMenu}>Log In</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/register" onClick={toggleMobileMenu}>Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
