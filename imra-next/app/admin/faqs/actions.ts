'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';

function readForm(fd: FormData) {
  return {
    question: String(fd.get('question') ?? '').trim(),
    answer: String(fd.get('answer') ?? '').trim(),
    position: Number(fd.get('position') ?? 0),
    is_published: fd.get('is_published') === 'on',
  };
}

export async function createFaqAction(fd: FormData) {
  const { supabase } = await requireAdmin('/admin/faqs/new');
  const data = readForm(fd);
  if (!data.question || !data.answer) throw new Error('Question et réponse requises.');

  const { error } = await supabase.from('faqs').insert(data);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/faqs');
  revalidatePath('/faq');
  redirect('/admin/faqs');
}

export async function updateFaqAction(id: string, fd: FormData) {
  const { supabase } = await requireAdmin(`/admin/faqs/${id}`);
  const data = readForm(fd);
  if (!data.question || !data.answer) throw new Error('Question et réponse requises.');

  const { error } = await supabase.from('faqs').update(data).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/faqs');
  revalidatePath(`/admin/faqs/${id}`);
  revalidatePath('/faq');
  redirect('/admin/faqs');
}

export async function deleteFaqAction(id: string) {
  const { supabase } = await requireAdmin('/admin/faqs');
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/faqs');
  revalidatePath('/faq');
}
