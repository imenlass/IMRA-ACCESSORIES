'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

export async function toggleMessageHandledAction(id: string, handled: boolean) {
  const { supabase } = await requireAdmin('/admin/messages');
  const { error } = await supabase
    .from('contact_messages')
    .update({ handled })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

export async function deleteMessageAction(id: string) {
  const { supabase } = await requireAdmin('/admin/messages');
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}
