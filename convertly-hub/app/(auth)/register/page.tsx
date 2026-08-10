import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-headings text-text-primary">
            Create an account
            </h1>
            <p className="text-text-secondary mt-2">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
                    Sign in
                </Link>
            </p>
        </div>
        <div className="bg-background border border-border rounded-lg shadow-sm p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
