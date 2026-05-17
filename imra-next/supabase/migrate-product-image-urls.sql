-- ============================================================
-- IMRA — Rewrite products.image_url to point at the storage bucket.
--
-- Prerequisites:
--   1. Run supabase/setup-product-images-bucket.sql
--   2. Upload the 6 product images into the `product-images` bucket
--      (matching filenames — bracelet-chaine-doree.png, etc.)
--
-- This script is idempotent: re-running is a no-op since it only touches
-- rows whose image_url still starts with '/products/'.
-- ============================================================

-- Your Supabase project URL — already filled in for your project.
-- If you switch to a different project, update this and re-run.

update public.products
set image_url =
  'https://ddthcksdcnvjpwlidzrp.supabase.co/storage/v1/object/public/product-images/'
  || regexp_replace(image_url, '^/products/', '')
where image_url like '/products/%';

-- Verify the result
select id, name, image_url from public.products order by display_order;
