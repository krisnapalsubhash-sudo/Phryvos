import { Metadata } from 'next';
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Sign In | Phryvos',
  description: 'Sign in to your Phryvos account',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/feed';

  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/14 blur-[110px]" />
          <div className="absolute -bottom-[15%] -right-[10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 dark:bg-violet-600/12 blur-[100px]" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary border-t-transparent flex items-center justify-center mx-auto mb-4 animate-spin">
              <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Loading...</h2>
          </div>
        </div>
      </div>
    }>
      <LoginClient callbackUrl={callbackUrl} />
    </Suspense>
  );
}