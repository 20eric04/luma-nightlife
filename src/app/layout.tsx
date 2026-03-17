import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luma — VIP Table Booking | Miami & NYC',
  description: 'Book VIP tables in 60 seconds. Real pricing, verified promoters, no DM negotiations. Miami & New York nightlife.',
  keywords: ['nightlife', 'booking', 'miami', 'new york', 'rooftop', 'vip', 'bottle service', 'promoter', 'club'],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Luma — VIP Tables in 60 Seconds',
    description: 'Book bottle service, rooftops, and nightlife in Miami & NYC. Real pricing. Verified promoters.',
    type: 'website',
    url: 'https://lumarsv.com',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Luma Nightlife Booking' }],
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
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Luma",
    url: "https://lumarsv.com",
    logo: "https://lumarsv.com/icon-512.png",
    description: "VIP table booking platform for nightlife in Miami and New York. Book bottle service, rooftops, and nightclubs in 60 seconds.",
    foundingDate: "2025",
    founder: { "@type": "Person", name: "Eric Harrity" },
    areaServed: [
      { "@type": "City", name: "Miami", containedInPlace: { "@type": "State", name: "Florida" } },
      { "@type": "City", name: "New York", containedInPlace: { "@type": "State", name: "New York" } },
    ],
    sameAs: [
      "https://instagram.com/lumanightlife",
      "https://twitter.com/20eric04",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://lumarsv.com",
    },
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Luma",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    url: "https://lumarsv.com",
    description: "Book VIP tables at top nightclubs, rooftops, and lounges in Miami and New York. Compare prices, choose your table, pay securely, and get a QR confirmation in 60 seconds.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free for guests. Promoters earn 15% commission on every booking.",
    },
    featureList: [
      "Real-time VIP table pricing",
      "Instant QR code confirmation",
      "Secure Stripe payments",
      "Promoter commission tracking",
      "60-second booking flow",
      "Miami and NYC venues",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Luma work?",
        acceptedAnswer: { "@type": "Answer", text: "Browse venues by city, type, and vibe. Pick a table, select your date and party size, pay securely through the app, and receive a QR code confirmation to show at the door. The entire process takes about 60 seconds." },
      },
      {
        "@type": "Question",
        name: "How much does Luma cost?",
        acceptedAnswer: { "@type": "Answer", text: "Luma is free for guests. You only pay for the table you book. Prices start at $100 depending on the venue. A 10% platform fee is included in the displayed price." },
      },
      {
        "@type": "Question",
        name: "What cities does Luma cover?",
        acceptedAnswer: { "@type": "Answer", text: "Luma currently covers nightlife venues in Miami and New York City, including nightclubs, rooftop bars, lounges, and pool parties." },
      },
      {
        "@type": "Question",
        name: "How do promoters earn money on Luma?",
        acceptedAnswer: { "@type": "Answer", text: "Promoters get a personal booking link. When guests book through that link, the promoter earns a 15% commission automatically tracked through their dashboard." },
      },
      {
        "@type": "Question",
        name: "Is Luma different from booking through a promoter on Instagram?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. With Luma you see real pricing upfront, pay securely through Stripe, and get an instant QR confirmation. No DM negotiations, no guessing on minimums, no showing up hoping your table exists." },
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Luma",
    url: "https://lumarsv.com",
    description: "VIP table booking for Miami and New York nightlife",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://lumarsv.com/app?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body style={{background:"#08080c",margin:0}}>{children}</body>
    </html>
  );
}
