import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import ProductForm from '@/components/admin/ProductForm';
import { updateProductAction } from '../actions';
import type { Product } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin(`/admin/products/${params.id}`);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !data) notFound();
  const product = data as Product;

  const boundAction = updateProductAction.bind(null, product.id);

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Link href="/admin/products" className="back-link">
            ← Produits
          </Link>
          <h1 className="admin-page-title">Modifier — {product.name}</h1>
        </div>
      </header>

      <div className="admin-card">
        <ProductForm mode="edit" initial={product} action={boundAction} />
      </div>
    </div>
  );
}
