import Link from "next/link";

const Header = () => {
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="font-bold text-lg text-accent">
            Convertly Hub
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-text-secondary hover:text-text-primary transition-colors">
              Docs
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors">
            Log In
          </Link>
          <Link href="/register" className="bg-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent-hover transition-colors">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
