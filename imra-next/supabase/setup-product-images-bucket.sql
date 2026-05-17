-- ============================================================
-- IMRA — Create the `product-images` storage bucket
-- Paste into Supabase → SQL Editor and run.
-- Safe to re-run.
-- ============================================================

-- 1. Create the bucket (publicly readable so <Image> tags can load it)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 2. RLS policies on the storage.objects table for this bucket

-- Anyone can READ files in product-images (browsers fetching product photos)
drop policy if exists "product-images read"      on storage.objects;
create policy "product-images read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Only authenticated users can write (upload). In practice you upload via:
--   • the Supabase dashboard (Storage → product-images), OR
--   • the scripts/upload-product-images.mjs helper (uses service_role and bypasses RLS)
-- Adjust this policy if you build an admin panel later.
drop policy if exists "product-images write"     on storage.objects;
create policy "product-images write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "product-images update"    on storage.objects;
create policy "product-images update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

drop policy if exists "product-images delete"    on storage.objects;
create policy "product-images delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- After this, upload the 6 product images (see README → "Move images to Supabase Storage"),
-- then run supabase/migrate-product-image-urls.sql to rewrite the products.image_url column.
