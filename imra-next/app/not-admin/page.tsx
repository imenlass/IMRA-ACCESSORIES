import Link from 'next/link';

export const metadata = { title: 'Accès refusé — IMRA' };

export default function NotAdminPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 18 }}>✦</div>
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 42,
            color: 'white',
            fontWeight: 300,
            marginBottom: 14,
          }}
        >
          Accès <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>refusé</em>
        </h1>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
          Cette zone est réservée à l&apos;administration. Si vous pensez qu&apos;il s&apos;agit
          d&apos;une erreur, contactez l&apos;équipe IMRA.
        </p>
        <Link href="/" className="btn">
          RETOUR À LA BOUTIQUE
        </Link>
      </div>
    </main>
  );
}
