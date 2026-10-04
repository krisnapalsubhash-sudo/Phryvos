import { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata: Metadata = {
  title: 'Verify Email | Phryvos',
  description: 'Verify your email address to access Phryvos',
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-background text-foreground relative overflow-hidden transition-colors">
        <div className="hero-glow-mesh" />
        <div className="w-full max-w-md mx-auto my-auto relative z-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary border-t-transparent flex items-center justify-center mx-auto mb-4 animate-spin">
            <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <VerifyEmailClient token={token} />
    </Suspense>
  );
}