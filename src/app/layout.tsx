import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Content Ideas Engine',
  description: 'Turn Readwise highlights into blog posts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

