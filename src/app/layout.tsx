import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'nextjs-service-template',
  description: 'nextjs-service-template — 범용 Next.js 15 App Router 템플릿',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
