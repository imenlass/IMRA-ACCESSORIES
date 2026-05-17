'use client';

type Props = {
  open: boolean;
  message?: string;
};

export default function AuthOverlay({ open, message = 'Connexion…' }: Props) {
  return (
    <div className={`auth-overlay ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="auth-overlay-card">
        <div className="spinner" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="msg">{message}</div>
      </div>
    </div>
  );
}
