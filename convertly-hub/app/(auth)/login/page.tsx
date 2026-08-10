import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-headings text-text-primary">
            Sign in to Convertly Hub
            </h1>
            <p className="text-text-secondary mt-2">
                Don't have an account yet?{' '}
                <Link href="/register" className="font-medium text-accent hover:text-accent-hover">
                    Sign up
                </Link>
            </p>
        </div>
        <div className="bg-background border border-border rounded-lg shadow-sm p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
