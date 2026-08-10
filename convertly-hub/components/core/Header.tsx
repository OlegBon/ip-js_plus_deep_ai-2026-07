"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="font-bold text-lg text-accent">
            Convertly Hub
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Docs
            </Link>
          </nav>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login" className="px-4 py-2 rounded-md text-sm font-medium text-text-primary border border-border hover:bg-gray-100 transition-colors">
            Log In
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 transition-colors">
            Sign Up
          </Link>
        </div>
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-text-primary">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <nav className="flex flex-col space-y-4 p-4">
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors" onClick={toggleMobileMenu}>
              Pricing
            </Link>
            <Link href="/docs" className="text-text-secondary hover:text-text-primary transition-colors" onClick={toggleMobileMenu}>
              Docs
            </Link>
            <div className="flex flex-row gap-4 pt-4">
              <Link href="/login" className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-text-primary border border-border hover:bg-gray-100 transition-colors text-center" onClick={toggleMobileMenu}>
                Log In
              </Link>
              <Link href="/register" className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-gray-800 text-white hover:bg-gray-900 transition-colors text-center" onClick={toggleMobileMenu}>
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
