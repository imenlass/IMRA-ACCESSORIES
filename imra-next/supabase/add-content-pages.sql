-- ============================================================
-- IMRA — Add content tables: site_pages + faqs
-- Paste into Supabase → SQL Editor. Safe to re-run.
-- ============================================================

-- ─── SITE_PAGES (legal / info pages) ────────────────────────
create table if not exists public.site_pages (
  slug         text primary key,
  title        text not null,
  eyebrow      text,
  content_html text not null,
  is_published boolean not null default true,
  updated_at   timestamptz not null default now()
);

alter table public.site_pages enable row level security;

drop policy if exists "site_pages read published" on public.site_pages;
create policy "site_pages read published"
  on public.site_pages for select
  using (is_published = true);

drop trigger if exists trg_site_pages_updated on public.site_pages;
create trigger trg_site_pages_updated before update on public.site_pages
  for each row execute function public.set_updated_at();

-- ─── FAQS ────────────────────────────────────────────────────
create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question     text not null,
  answer       text not null,
  position     integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists faqs_position_idx on public.faqs(position);

alter table public.faqs enable row level security;

drop policy if exists "faqs read published" on public.faqs;
create policy "faqs read published"
  on public.faqs for select
  using (is_published = true);

-- ─── SEED CONTENT ───────────────────────────────────────────
insert into public.site_pages (slug, title, eyebrow, content_html) values
  ('livraison-retours', 'Livraison & Retours', 'INFORMATIONS', $$
<h2>Livraison</h2>
<p>Toutes nos commandes sont préparées avec soin dans nos ateliers à Tunis et expédiées sous 24 à 48 heures ouvrées après confirmation.</p>
<ul>
  <li><strong>Tunisie</strong> — Livraison à domicile en 3 à 5 jours ouvrés via nos transporteurs partenaires.</li>
  <li><strong>International</strong> — Livraison express via DHL ou FedEx en 5 à 10 jours ouvrés selon la destination.</li>
  <li><strong>Suivi</strong> — Un numéro de suivi vous est communiqué par email dès l''expédition.</li>
  <li><strong>Emballage</strong> — Chaque pièce est livrée dans son écrin IMRA, prêt à offrir.</li>
</ul>

<h2>Retours</h2>
<p>Vous disposez de <strong>14 jours</strong> à compter de la réception pour retourner votre commande, sans avoir à justifier votre choix.</p>
<ul>
  <li>Les articles doivent être renvoyés dans leur état d''origine, non portés, dans leur emballage IMRA.</li>
  <li>Les pièces réalisées sur mesure ne sont pas reprises ni échangées.</li>
  <li>Les frais de retour sont à la charge de la cliente, sauf en cas d''erreur de notre part.</li>
  <li>Le remboursement intervient sous 7 jours ouvrés après réception et vérification du colis.</li>
</ul>

<h2>Une question&nbsp;?</h2>
<p>Notre équipe se tient à votre disposition pour toute demande sur votre commande, votre livraison ou un retour. Écrivez-nous à <a href="mailto:imraaccessories@gmail.com">imraaccessories@gmail.com</a> ou via le formulaire de contact.</p>
$$),

  ('conditions-generales', 'Conditions Générales de Vente', 'MENTIONS LÉGALES', $$
<h2>1. Identification</h2>
<p>Les présentes conditions générales de vente régissent l''ensemble des transactions effectuées sur la boutique en ligne IMRA Accessories, marque artisanale basée à Tunis.</p>

<h2>2. Objet</h2>
<p>IMRA propose à la vente des bijoux et accessoires faits main, conçus en éditions limitées. Toute commande passée sur le site implique l''acceptation pleine et entière des présentes conditions.</p>

<h2>3. Prix</h2>
<p>Les prix sont affichés en Dinar Tunisien (DT) et s''entendent toutes taxes comprises. Les frais de livraison sont calculés en fonction de la destination et précisés avant la confirmation de la commande.</p>

<h2>4. Commandes</h2>
<p>La commande est définitivement enregistrée après confirmation par email. IMRA se réserve le droit d''annuler toute commande en cas de rupture de stock, d''erreur manifeste de prix ou de doute sur l''identité de l''acheteuse.</p>

<h2>5. Paiement</h2>
<p>Les paiements sont acceptés par virement bancaire, paiement à la livraison et mobile money. Aucune donnée bancaire n''est conservée sur nos serveurs.</p>

<h2>6. Livraison &amp; rétractation</h2>
<p>Les conditions de livraison et de retour sont détaillées dans la page <em>Livraison &amp; Retours</em>.</p>

<h2>7. Garanties</h2>
<p>Chaque pièce IMRA bénéficie d''une garantie artisan d''un an couvrant les défauts de fabrication. Cette garantie ne couvre pas l''usure normale, les chocs ou un mauvais entretien.</p>

<h2>8. Données personnelles</h2>
<p>Les données collectées lors de votre commande sont utilisées exclusivement pour le traitement de votre commande et pour vous tenir informée de nos nouveautés. Vous disposez d''un droit d''accès, de rectification et de suppression de vos données en écrivant à <a href="mailto:imraaccessories@gmail.com">imraaccessories@gmail.com</a>.</p>

<h2>9. Propriété intellectuelle</h2>
<p>L''ensemble des éléments du site (photographies, textes, logos, créations) est la propriété exclusive d''IMRA Accessories. Toute reproduction est interdite sans autorisation écrite.</p>

<h2>10. Droit applicable</h2>
<p>Les présentes conditions sont soumises au droit tunisien. Tout litige relèvera de la compétence exclusive des tribunaux de Tunis.</p>
$$)
on conflict (slug) do nothing;

insert into public.faqs (question, answer, position) values
  ('Comment sont fabriqués les bijoux IMRA&nbsp;?',
   'Chaque pièce est entièrement réalisée à la main dans notre atelier à Tunis. Nous travaillons des matériaux nobles — perles d''eau douce, pierres semi-précieuses, métaux plaqués or — assemblés un à un avec patience et précision.',
   1),
  ('Quels sont les délais de livraison&nbsp;?',
   'En Tunisie&nbsp;: 3 à 5 jours ouvrés. À l''international&nbsp;: 5 à 10 jours ouvrés via DHL ou FedEx, avec un numéro de suivi communiqué par email dès l''expédition.',
   2),
  ('Puis-je commander une pièce sur mesure&nbsp;?',
   'Oui. Écrivez-nous à <a href="mailto:imraaccessories@gmail.com">imraaccessories@gmail.com</a> ou via le formulaire de contact en précisant votre idée, votre budget et le délai souhaité. Nous revenons vers vous sous 48 heures avec une proposition personnalisée.',
   3),
  ('Comment entretenir mes bijoux&nbsp;?',
   'Rangez vos pièces dans leur écrin IMRA à l''abri de l''humidité. Évitez le contact avec les parfums, crèmes, eau de mer et chlore. Nettoyez délicatement avec un chiffon doux et sec pour préserver l''éclat des matériaux.',
   4),
  ('Quels moyens de paiement acceptez-vous&nbsp;?',
   'Nous acceptons le paiement à la livraison, le virement bancaire et le mobile money. Le paiement par carte sera prochainement disponible.',
   5),
  ('Comment retourner un article&nbsp;?',
   'Vous disposez de 14 jours à compter de la réception pour retourner votre commande, à l''exception des pièces sur mesure. Contactez-nous au préalable pour déclencher la procédure. Les frais de retour sont à votre charge.',
   6),
  ('Mes bijoux sont-ils garantis&nbsp;?',
   'Oui, chaque création IMRA bénéficie d''une garantie d''un an couvrant les défauts de fabrication. L''usure normale, les chocs et le mauvais entretien ne sont pas couverts.',
   7)
on conflict do nothing;
