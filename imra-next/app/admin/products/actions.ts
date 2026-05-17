'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';

const BUCKET = 'product-images';

function buildPublicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function maybeUploadImage(supabase: ReturnType<typeof import('@/lib/supabase/server').createClient>, file: File | null, slug: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase();
  const objectPath = `${slug}-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buf, {
    contentType: file.type || 'image/png',
    upsert: false,
  });
  if (error) throw new Error(`Upload échoué: ${error.message}`);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return buildPublicUrl(supabaseUrl, objectPath);
}

function readForm(fd: FormData) {
  return {
    name: String(fd.get('name') ?? '').trim(),
    slug: String(fd.get('slug') ?? '').trim().toLowerCase().replace(/\s+/g, '-'),
    description: String(fd.get('description') ?? '').trim(),
    price: Number(fd.get('price') ?? 0),
    currency: String(fd.get('currency') ?? 'DT').trim(),
    collection: String(fd.get('collection') ?? 'red-carpet').trim(),
    stock: Number(fd.get('stock') ?? 0),
    is_active: fd.get('is_active') === 'on',
    display_order: Number(fd.get('display_order') ?? 0),
    image_url: String(fd.get('image_url') ?? '').trim(),
    image_file: fd.get('image_file') as File | null,
  };
}

export async function createProductAction(fd: FormData) {
  const { supabase } = await requireAdmin('/admin/products/new');
  const data = readForm(fd);

  if (!data.name || !data.slug) {
    throw new Error('Nom et slug requis.');
  }

  // Upload image if provided
  let finalImageUrl = data.image_url;
  if (data.image_file && data.image_file.size > 0) {
    const uploaded = await maybeUploadImage(supabase, data.image_file, data.slug);
    if (uploaded) finalImageUrl = uploaded;
  }
  if (!finalImageUrl) {
    throw new Error('Image requise (upload ou URL).');
  }

  const { error } = await supabase.from('products').insert({
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    price: data.price,
    currency: data.currency,
    collection: data.collection,
    stock: data.stock,
    is_active: data.is_active,
    display_order: data.display_order,
    image_url: finalImageUrl,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/admin/products');
  revalidatePath('/');
  redirect('/admin/products');
}

export async function updateProductAction(id: string, fd: FormData) {
  const { supabase } = await requireAdmin(`/admin/products/${id}`);
  const data = readForm(fd);

  if (!data.name || !data.slug) {
    throw new Error('Nom et slug requis.');
  }

  let finalImageUrl = data.image_url;
  if (data.image_file && data.image_file.size > 0) {
    const uploaded = await maybeUploadImage(supabase, data.image_file, data.slug);
    if (uploaded) finalImageUrl = uploaded;
  }
  if (!finalImageUrl) {
    throw new Error('Image requise.');
  }

  const { error } = await supabase
    .from('products')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      price: data.price,
      currency: data.currency,
      collection: data.collection,
      stock: data.stock,
      is_active: data.is_active,
      display_order: data.display_order,
      image_url: finalImageUrl,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}`);
  revalidatePath('/');
  redirect('/admin/products');
}

export async function deleteProductAction(id: string) {
  const { supabase } = await requireAdmin('/admin/products');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/products');
  revalidatePath('/');
}
