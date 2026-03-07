import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luma – Premium Nightlife Booking',
  description: 'Your personal concierge for premium nightlife access in Miami and New York.',
  keywords: ['nightlife', 'booking', 'miami', 'new york', 'rooftop', 'vip', 'bottle service'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Luma',
    description: 'Premium nightlife. Book your table.',
    type: 'website',
    url: 'https://luma.vip',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Luma Nightlife' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luma',
    description: 'Premium nightlife. Book your table.',
    creator: '@20eric04',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Luma',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
