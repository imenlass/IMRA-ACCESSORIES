import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import MessageActions from '@/components/admin/MessageActions';
import AdminSearch from '@/components/admin/AdminSearch';
import AdminAdvancedFilters from '@/components/admin/AdminAdvancedFilters';
import AdminDateRangeFilter from '@/components/admin/AdminDateRangeFilter';
import AdminSelectFilter from '@/components/admin/AdminSelectFilter';

export const dynamic = 'force-dynamic';

type Search = {
  q?: string;
  filter?: string;
  from?: string;
  to?: string;
  subject?: string; // 'with' | 'without'
  user?: string;    // 'registered' | 'guest'
};

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  user_id: string | null;
  created_at: string;
};

function sanitize(s: string): string {
  return s.replace(/[,()*]/g, ' ').trim();
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { supabase } = await requireAdmin('/admin/messages');

  let query = supabase
    .from('contact_messages')
    .select('*', { count: 'exact' });

  if (searchParams.q) {
    const q = sanitize(searchParams.q);
    if (q) {
      const like = `%${q}%`;
      query = query.or(
        `name.ilike.${like},email.ilike.${like},subject.ilike.${like},message.ilike.${like}`
      );
    }
  }

  if (searchParams.filter === 'unread') query = query.eq('handled', false);
  if (searchParams.filter === 'read') query = query.eq('handled', true);

  if (searchParams.from) query = query.gte('created_at', searchParams.from);
  if (searchParams.to) query = query.lte('created_at', `${searchParams.to}T23:59:59`);

  if (searchParams.subject === 'with') query = query.not('subject', 'is', null);
  if (searchParams.subject === 'without') query = query.is('subject', null);

  if (searchParams.user === 'registered') query = query.not('user_id', 'is', null);
  if (searchParams.user === 'guest') query = query.is('user_id', null);

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;
  const messages = (data ?? []) as Message[];

  function filterHref(key: string) {
    const sp = new URLSearchParams();
    if (searchParams.q) sp.set('q', searchParams.q);
    if (searchParams.from) sp.set('from', searchParams.from);
    if (searchParams.to) sp.set('to', searchParams.to);
    if (searchParams.subject) sp.set('subject', searchParams.subject);
    if (searchParams.user) sp.set('user', searchParams.user);
    if (key !== 'all') sp.set('filter', key);
    return `/admin/messages${sp.toString() ? `?${sp.toString()}` : ''}`;
  }

  const currentFilter = searchParams.filter ?? 'all';

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Messages</h1>
          <p className="admin-page-sub">
            {count ?? messages.length} message{(count ?? messages.length) > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* ── Filter bar ── */}
      <section className="admin-filter-bar">
        <AdminSearch placeholder="Rechercher par nom, email, sujet, contenu…" />
        <div className="admin-tabs">
          <Link
            href={filterHref('all')}
            className={`admin-tab ${currentFilter === 'all' ? 'active' : ''}`}
          >
            Tous
          </Link>
          <Link
            href={filterHref('unread')}
            className={`admin-tab ${currentFilter === 'unread' ? 'active' : ''}`}
          >
            Non lus
          </Link>
          <Link
            href={filterHref('read')}
            className={`admin-tab ${currentFilter === 'read' ? 'active' : ''}`}
          >
            Lus
          </Link>
        </div>
        <AdminAdvancedFilters
          controlledParams={['from', 'to', 'subject', 'user']}
          keepParams={['q', 'filter']}
        >
          <div className="adv-grid">
            <AdminDateRangeFilter label="Date de réception" />
            <AdminSelectFilter
              label="Sujet"
              param="subject"
              options={[
                { value: 'with', label: 'Avec sujet' },
                { value: 'without', label: 'Sans sujet' },
              ]}
              placeholder="Indifférent"
            />
            <AdminSelectFilter
              label="Auteur"
              param="user"
              options={[
                { value: 'registered', label: 'Client inscrit' },
                { value: 'guest', label: 'Invité' },
              ]}
              placeholder="Tous"
            />
          </div>
        </AdminAdvancedFilters>
      </section>

      {error && <div className="admin-error">{error.message}</div>}

      {messages.length === 0 ? (
        <div className="admin-card admin-empty" style={{ padding: 40, textAlign: 'center' }}>
          Aucun message ne correspond à vos critères.
        </div>
      ) : (
        <div className="admin-messages">
          {messages.map((m) => (
            <article key={m.id} className={`admin-message ${m.handled ? 'is-handled' : 'is-fresh'}`}>
              <header>
                <div>
                  <div className="from">
                    <strong>{m.name}</strong>{' '}
                    <a href={`mailto:${m.email}`} className="admin-dim">&lt;{m.email}&gt;</a>
                  </div>
                  {m.subject && <div className="subject">{m.subject}</div>}
                </div>
                <div className="meta">
                  {!m.handled && <span className="dot" />}
                  <span className="admin-dim">
                    {new Date(m.created_at).toLocaleString('fr-FR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </header>
              <div className="body">{m.message}</div>
              <footer>
                <MessageActions id={m.id} handled={m.handled} />
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
