import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/design-system';
import { AmbientBackground } from '@/components/effects/AmbientBackground';
import { InstallPrompt } from '@/components/pwa/InstallPromptModal';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.phryvos.in'),
  title: {
    default: 'Phryvos — Where Strangers Become Stories',
    template: '%s | Phryvos',
  },
  description: 'A next-generation social discovery & human connection platform. Connect authentically through radar discovery, real-time chat, interactive games, and shared moments with people around the world.',
  applicationName: 'Phryvos',
  keywords: [
    'Phryvos',
    'Phryvos social media',
    'social discovery',
    'human connection',
    'social media platform',
    'make friends online',
    'real-time chat',
    'radar discovery',
    'social network',
    'authentic connections',
    'community platform'
  ],
  authors: [{ name: 'Phryvos', url: 'https://www.phryvos.in' }],
  creator: 'Phryvos',
  publisher: 'Phryvos',
  alternates: {
    canonical: 'https://www.phryvos.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.phryvos.in',
    siteName: 'Phryvos',
    title: 'Phryvos — Where Strangers Become Stories',
    description: 'A global social discovery & human connection platform. Discover people around you, chat in real-time, play activities, and share moments.',
    images: [
      {
        url: '/brand/logo-icon-512.png',
        width: 512,
        height: 512,
        alt: 'Phryvos — Social Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Phryvos — Where Strangers Become Stories',
    description: 'A global social discovery & human connection platform.',
    images: ['/brand/logo-icon-512.png'],
    creator: '@phryvos',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.phryvos.in/#website',
      url: 'https://www.phryvos.in',
      name: 'Phryvos',
      description: 'A next-generation social discovery & human connection platform where strangers become stories.',
      publisher: {
        '@id': 'https://www.phryvos.in/#organization',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.phryvos.in/#organization',
      name: 'Phryvos',
      url: 'https://www.phryvos.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.phryvos.in/brand/logo-icon-512.png',
      },
      description: 'Global social discovery and human connection network.',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/brand/logo-icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
