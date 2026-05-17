import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';

export const metadata: Metadata = {
  title: 'IMRA — Bijoux de Luxe',
  description:
    'IMRA, l\'alliance de la féminité, de la créativité et du savoir-faire artisanal. Des bijoux uniques, faits main avec passion.',
  icons: {
    icon: '/favicon.ico',
  },
};

// Explicit viewport — also restricts scaling to 5x and matches device width
// so the marketing site and admin both render correctly on phones.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#090204',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Poppins:wght@200;300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <Header />
          {children}
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
