import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="bg-background-secondary flex flex-grow items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-headings text-text-primary text-3xl font-bold">
            Sign in to Convertly Hub
          </h1>
          <p className="text-text-secondary mt-2">
            Don&apos;t have an account yet?{' '}
            <Link href="/register" className="text-accent hover:text-accent-hover font-medium">
              Sign up
            </Link>
          </p>
        </div>
        <div className="bg-background border-border rounded-lg border p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
