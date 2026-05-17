'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setEmail('');
  }

  if (submitted) {
    return (
      <p style={{ marginTop: 20, color: 'var(--gold)', fontSize: 12, letterSpacing: 1 }}>
        ✦ Merci ! Vous êtes inscrite.
      </p>
    );
  }

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <input
        type="email"
        placeholder="Votre adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">S&apos;INSCRIRE</button>
    </form>
  );
}
