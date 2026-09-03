import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-grow flex-col items-center justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
      <h1 className="text-4xl font-bold text-text-primary mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-text-secondary mb-8">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-6 py-3 text-lg font-semibold text-white hover:bg-primary/90"
      >
        Go back to Home
      </Link>
    </div>
  );
}
