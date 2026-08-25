import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

type Props = { searchParams: Promise<{ plan?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { plan } = await searchParams;
  return (
    <div className="bg-background-secondary flex flex-grow items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
            <h1 className="font-headings text-text-primary text-3xl font-bold">
            Create an account
            </h1>
            <p className="text-text-secondary mt-2">
                Already have an account?{' '}
                <Link href={plan ? `/login?callbackUrl=${encodeURIComponent(`/pricing?checkout=${plan}`)}` : '/login'} className="text-accent hover:text-accent-hover font-medium">
                    Sign in
                </Link>
            </p>
        </div>
        <div className="bg-background border-border rounded-lg border p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
