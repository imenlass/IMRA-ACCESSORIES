import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import ProductForm from '@/components/admin/ProductForm';
import { createProductAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  await requireAdmin('/admin/products/new');

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/products" className="back-link">
            ← Produits
          </Link>
          <h1 className="admin-page-title">Nouveau produit</h1>
        </div>
      </header>

      <div className="admin-card">
        <ProductForm mode="create" action={createProductAction} />
      </div>
    </div>
  );
}
