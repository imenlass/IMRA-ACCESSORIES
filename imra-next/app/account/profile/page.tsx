import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Footer from '@/components/Footer';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import EmailForm from '@/components/profile/EmailForm';
import PasswordForm from '@/components/profile/PasswordForm';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon profil — IMRA',
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/account/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const p = (profile ?? {
    id: user.id,
    full_name: null,
    phone: null,
    address: null,
    created_at: '',
    updated_at: '',
  }) as Profile;

  return (
    <>
      <main className="account-page">
        <div className="container" style={{ maxWidth: 760 }}>
          <Link href="/account/orders" className="back-link">
            ← Mes commandes
          </Link>

          <h1>
            Mon <em>profil</em>
          </h1>
          <p className="subtitle">Gérez vos informations personnelles, votre email et votre mot de passe.</p>

          <div className="profile-sections">
            <section className="profile-card">
              <header className="profile-card-head">
                <h2>Informations personnelles</h2>
                <span className="profile-card-sub">
                  Connecté avec <strong>{user.email}</strong>
                </span>
              </header>
              <PersonalInfoForm initial={p} />
            </section>

            <section className="profile-card">
              <header className="profile-card-head">
                <h2>Adresse email</h2>
              </header>
              <EmailForm currentEmail={user.email ?? ''} />
            </section>

            <section className="profile-card">
              <header className="profile-card-head">
                <h2>Mot de passe</h2>
              </header>
              <PasswordForm />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
