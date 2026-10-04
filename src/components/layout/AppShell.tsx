'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LeftRail } from '@/components/layout/LeftRail';
import { TopBar } from '@/components/layout/TopBar';
import { RightRail } from '@/components/layout/RightRail';
import FeedContainer from '@/components/layout/FeedContainer';
import { BottomNav } from '@/components/layout/BottomNav';
import { CosmicRadioDock } from '@/components/audio/CosmicRadioDock';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = ['/login', '/register', '/onboarding', '/redirect'].includes(pathname);
  const isLandingPage = pathname === '/';
  const isRadar = pathname === '/radar' || pathname.startsWith('/radar');
  const isAuthenticated = status === 'authenticated';

  // Loading spinner during hydration
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl phryvos-gradient flex items-center justify-center mx-auto text-white font-bold text-xl shadow-lg shadow-indigo-500/20 animate-bounce">
            I
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Landing page renders without AppShell chrome
  if (isLandingPage || isAuthPage) {
    return <>{children}</>;
  }

  // Redirect to login if not authenticated on app pages
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (isRadar) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 relative">
          {children}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex transition-colors">
      {/* Desktop Navigation Rail */}
      <div className="hidden md:block">
        <LeftRail />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-20 transition-all">
        <TopBar />

        <div className="flex-1 flex overflow-hidden">
          <FeedContainer>
            <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-10">
              {children}
            </main>
          </FeedContainer>
          <RightRail />
        </div>
      </div>

      {/* Mobile Bottom Dock */}
      <BottomNav />

      {/* Persistent Floating Cosmic Radio Dock */}
      <CosmicRadioDock />
    </div>
  );
}
