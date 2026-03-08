'use client';

// The Luma app is a self-contained React component.
// In production this would be split into proper Next.js pages,
// but this structure makes it easy to iterate on the UI rapidly.
import dynamic from 'next/dynamic';

const LumaApp = dynamic(() => import('@/components/LumaApp'), { ssr: false });

export default function Page() {
  return <LumaApp />;
}
