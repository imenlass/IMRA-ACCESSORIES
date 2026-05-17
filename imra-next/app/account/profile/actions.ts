'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function requireSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?redirect=/account/profile');
  }
  return { supabase, user };
}

export async function updatePersonalInfoAction(fd: FormData) {
  const { supabase, user } = await requireSession();

  const data = {
    full_name: String(fd.get('full_name') ?? '').trim() || null,
    phone: String(fd.get('phone') ?? '').trim() || null,
    address: String(fd.get('address') ?? '').trim() || null,
  };

  // Upsert in case the row didn't exist yet (e.g. older accounts before the
  // auto-create trigger was added).
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...data }, { onConflict: 'id' });

  if (error) throw new Error(error.message);

  revalidatePath('/account/profile');
  revalidatePath('/admin/profile');
}

export async function updateEmailAction(fd: FormData) {
  const { supabase } = await requireSession();
  const newEmail = String(fd.get('new_email') ?? '').trim().toLowerCase();

  if (!newEmail) throw new Error('Adresse email requise.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
    throw new Error('Adresse email invalide.');
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw new Error(error.message);

  // Supabase sends a confirmation email to the new address. Until the user
  // clicks the link, their email stays the same. No revalidation needed.
}

export async function updatePasswordAction(fd: FormData) {
  const { supabase, user } = await requireSession();
  if (!user.email) throw new Error('Aucun email associé à ce compte.');

  const currentPassword = String(fd.get('current_password') ?? '');
  const newPassword = String(fd.get('new_password') ?? '');
  const confirmPassword = String(fd.get('confirm_password') ?? '');

  if (!currentPassword) throw new Error('Mot de passe actuel requis.');
  if (newPassword.length < 6) {
    throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
  }
  if (newPassword !== confirmPassword) {
    throw new Error('Les deux nouveaux mots de passe ne correspondent pas.');
  }
  if (newPassword === currentPassword) {
    throw new Error("Le nouveau mot de passe doit être différent de l'ancien.");
  }

  // Verify current password by attempting a sign-in with it
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) throw new Error('Mot de passe actuel incorrect.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
