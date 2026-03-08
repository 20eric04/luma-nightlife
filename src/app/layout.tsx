import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luma — VIP Table Booking | Miami & NYC',
  description: 'Book VIP tables in 60 seconds. Real pricing, verified promoters, no DM negotiations. Miami & New York nightlife.',
  keywords: ['nightlife', 'booking', 'miami', 'new york', 'rooftop', 'vip', 'bottle service', 'promoter', 'club'],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Luma — VIP Tables in 60 Seconds',
    description: 'Book bottle service, rooftops, and nightlife in Miami & NYC. Real pricing. Verified promoters.',
    type: 'website',
    url: 'https://lumarsv.com',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Luma Nightlife Booking' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luma — VIP Tables in 60 Seconds',
    description: 'Book bottle service, rooftops, and nightlife in Miami & NYC.',
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
