import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'evidence-finder',
  description: 'evidence-finder — 유포된 증거를 찾습니다',
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
