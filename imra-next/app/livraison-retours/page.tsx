import SitePage from '@/components/SitePage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Livraison & Retours — IMRA',
  description: 'Conditions de livraison et politique de retour IMRA Accessories.',
};

export default function Page() {
  return <SitePage slug="livraison-retours" />;
}
