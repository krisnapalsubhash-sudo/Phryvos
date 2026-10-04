import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/design-system';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { InstallPrompt } from '@/components/pwa/InstallPromptModal';

export const metadata: Metadata = {
  title: 'Phryvos — Where Strangers Become Stories',
  description: 'A global social discovery & human connection platform. Connect through radar, real-time chat, and shared moments with people around the world.',
  manifest: '/manifest.json',
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Phryvos',
  },
  icons: {
    icon: '/brand/logo-icon-512.png',
    apple: '/brand/logo-icon-512.png',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brand/logo-icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>
          <AmbientBackground />
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
