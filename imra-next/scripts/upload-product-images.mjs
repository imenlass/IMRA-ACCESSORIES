#!/usr/bin/env node
/**
 * Upload all PNG/JPG/WebP files from `public/products/` into the
 * `product-images` Supabase Storage bucket.
 *
 * Why a script? Because uploading via SQL isn't possible (Storage is a
 * separate service). You can equivalently drag-and-drop the files in the
 * Supabase dashboard → Storage → product-images.
 *
 * USAGE (one-off, requires service_role to bypass storage RLS for write):
 *
 *   # PowerShell
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI..."
 *   node scripts/upload-product-images.mjs
 *
 *   # bash
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/upload-product-images.mjs
 *
 * The script reads NEXT_PUBLIC_SUPABASE_URL from .env.local automatically.
 * It does NOT use the anon key — uploads require service_role.
 *
 * The service_role key never leaves your machine; it is not committed and
 * not bundled into the Next.js app.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = resolve(__dirname, '..');

// ─── Read env from .env.local if present ────────────────────────────────
function loadEnvLocal() {
  const path = join(projectRoot, '.env.local');
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL missing (set it in .env.local).');
  process.exit(1);
}
if (!SERVICE_ROLE) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY missing.');
  console.error('   Pass it inline:  SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-product-images.mjs');
  console.error('   (Do NOT commit it. Do NOT put it in .env.local.)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'product-images';
const DIR = join(projectRoot, 'public', 'products');

const EXT_TO_TYPE = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

console.log(`📤 Uploading images from ${DIR}\n   → bucket "${BUCKET}" at ${SUPABASE_URL}\n`);

let ok = 0;
let fail = 0;

for (const file of await readdir(DIR)) {
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const contentType = EXT_TO_TYPE[ext];
  if (!contentType) {
    console.log(`   ↷ skipping ${file} (unsupported extension)`);
    continue;
  }

  const buf = await readFile(join(DIR, file));
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(file, buf, { upsert: true, contentType });

  if (error) {
    console.log(`   ✗ ${file}  →  ${error.message}`);
    fail++;
  } else {
    console.log(`   ✓ ${file}`);
    ok++;
  }
}

console.log(`\nDone. ${ok} uploaded, ${fail} failed.`);
if (fail === 0) {
  console.log('\nNext step: run supabase/migrate-product-image-urls.sql to update products.image_url.');
}
process.exit(fail ? 1 : 0);
