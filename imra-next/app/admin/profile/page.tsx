import { requireAdmin } from '@/lib/admin';
import PersonalInfoForm from '@/components/profile/PersonalInfoForm';
import EmailForm from '@/components/profile/EmailForm';
import PasswordForm from '@/components/profile/PasswordForm';
import type { Profile } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mon profil — Administration IMRA',
};

export default async function AdminProfilePage() {
  const { supabase, user } = await requireAdmin('/admin/profile');

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
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">
            Mon <em>profil</em>
          </h1>
          <p className="admin-page-sub">
            Connecté avec <strong>{user.email}</strong>
          </p>
        </div>
      </header>

      <div className="profile-sections">
        <section className="admin-card profile-card">
          <header className="profile-card-head">
            <h2>Informations personnelles</h2>
          </header>
          <PersonalInfoForm initial={p} />
        </section>

        <section className="admin-card profile-card">
          <header className="profile-card-head">
            <h2>Adresse email</h2>
          </header>
          <EmailForm currentEmail={user.email ?? ''} />
        </section>

        <section className="admin-card profile-card">
          <header className="profile-card-head">
            <h2>Mot de passe</h2>
          </header>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
