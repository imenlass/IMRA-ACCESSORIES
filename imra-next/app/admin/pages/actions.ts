'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';

function readForm(fd: FormData) {
  return {
    slug: String(fd.get('slug') ?? '').trim().toLowerCase().replace(/\s+/g, '-'),
    title: String(fd.get('title') ?? '').trim(),
    eyebrow: String(fd.get('eyebrow') ?? '').trim() || null,
    content_html: String(fd.get('content_html') ?? '').trim(),
    is_published: fd.get('is_published') === 'on',
  };
}

export async function createPageAction(fd: FormData) {
  const { supabase } = await requireAdmin('/admin/pages/new');
  const data = readForm(fd);
  if (!data.slug || !data.title || !data.content_html) {
    throw new Error('Slug, titre et contenu requis.');
  }

  const { error } = await supabase.from('site_pages').insert(data);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/pages');
  revalidatePath(`/${data.slug}`);
  redirect('/admin/pages');
}

export async function updatePageAction(originalSlug: string, fd: FormData) {
  const { supabase } = await requireAdmin(`/admin/pages/${originalSlug}`);
  const data = readForm(fd);
  if (!data.slug || !data.title || !data.content_html) {
    throw new Error('Slug, titre et contenu requis.');
  }

  const { error } = await supabase
    .from('site_pages')
    .update(data)
    .eq('slug', originalSlug);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/pages');
  revalidatePath(`/admin/pages/${originalSlug}`);
  revalidatePath(`/${originalSlug}`);
  if (data.slug !== originalSlug) revalidatePath(`/${data.slug}`);
  redirect('/admin/pages');
}

export async function deletePageAction(slug: string) {
  const { supabase } = await requireAdmin('/admin/pages');
  const { error } = await supabase.from('site_pages').delete().eq('slug', slug);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/pages');
  revalidatePath(`/${slug}`);
}
