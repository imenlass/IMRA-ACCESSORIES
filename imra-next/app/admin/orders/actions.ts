'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin';

const ALLOWED = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type Status = (typeof ALLOWED)[number];

export async function updateOrderStatusAction(id: string, status: string) {
  const { supabase } = await requireAdmin(`/admin/orders/${id}`);

  if (!ALLOWED.includes(status as Status)) {
    throw new Error(`Statut invalide: ${status}`);
  }

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin');
  revalidatePath('/account/orders');
  revalidatePath(`/account/orders/${id}`);
}

export async function deleteOrderAction(id: string) {
  const { supabase } = await requireAdmin('/admin/orders');
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}
