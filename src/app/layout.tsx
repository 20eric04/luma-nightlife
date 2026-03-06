import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luma – Premium Nightlife Booking',
  description: 'Your personal concierge for premium nightlife access in Miami and New York.',
  keywords: ['nightlife', 'booking', 'miami', 'new york', 'rooftop', 'vip', 'bottle service'],
  openGraph: {
    title: 'Luma',
    description: 'Premium nightlife. Book your table.',
    type: 'website',
    url: 'https://luma.vip',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Luma Nightlife' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luma',
    description: 'Premium nightlife. Book your table.',
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
      <body>{children}</body>
    </html>
  );
}
