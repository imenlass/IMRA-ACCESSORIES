// ============================================================
// IMRA — seed an admin account
//
// Creates (or updates) an auth.users row with the given credentials,
// marks email as confirmed, and inserts the user into public.admins.
// Safe to re-run.
//
// Requires service_role key. NEVER hardcode it — pass via env:
//
//   SUPABASE_SERVICE_ROLE_KEY=<key> \
//   SEED_ADMIN_EMAIL=admin@example.com \
//   SEED_ADMIN_PASSWORD=<password> \
//   node scripts/seed-admin.mjs
//
// You can also rely on .env.local providing NEXT_PUBLIC_SUPABASE_URL.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// Load NEXT_PUBLIC_SUPABASE_URL from .env.local if not in env
async function loadEnvFile() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  if (!existsSync('.env.local')) return;
  const content = await readFile('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*)$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
await loadEnvFile();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;

if (!url) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
if (!serviceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!email || !password) {
  console.error('Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`◆ Seeding admin: ${email}`);

let userId;

// Step 1: create user. If already exists, fall through to update.
console.log('  → creating user (email auto-confirmed)…');
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (created?.user) {
  userId = created.user.id;
  console.log(`  ✓ created (id ${userId})`);
} else {
  const alreadyExists =
    createErr &&
    (createErr.message?.toLowerCase().includes('already') ||
      createErr.code === 'email_exists' ||
      createErr.status === 422);

  if (!alreadyExists) {
    console.error('  ✗ create failed:', createErr?.message ?? createErr);
    process.exit(1);
  }

  console.log('  → user already exists, looking up id…');
  // listUsers is paginated; for our scale a single page is fine
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) {
    console.error('  ✗ listUsers failed:', listErr.message);
    process.exit(1);
  }
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error('  ✗ existing user not found in list');
    process.exit(1);
  }
  userId = existing.id;
  console.log(`  ✓ found (id ${userId})`);

  // Update password + ensure confirmed
  console.log('  → updating password + confirming email…');
  const { error: updErr } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });
  if (updErr) {
    console.error('  ✗ update failed:', updErr.message);
    process.exit(1);
  }
  console.log('  ✓ updated');
}

// Step 2: insert into admins table. service_role bypasses RLS.
console.log('  → inserting into admins…');
const { error: adminErr } = await supabase
  .from('admins')
  .upsert({ user_id: userId }, { onConflict: 'user_id' });

if (adminErr) {
  console.error('  ✗ admin insert failed:', adminErr.message);
  process.exit(1);
}

console.log('  ✓ admin granted');
console.log('');
console.log('Done. Sign in at /admin-login with:');
console.log(`  email:    ${email}`);
console.log(`  password: ${'*'.repeat(password.length)}`);
