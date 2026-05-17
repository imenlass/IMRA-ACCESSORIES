'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import Spinner from './Spinner';

type FormState = { name: string; email: string; subject: string; message: string };
const EMPTY: FormState = { name: '', email: '', subject: '', message: '' };

export default function ContactForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Merci de remplir les champs requis.');
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: insertErr } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || null,
        message: form.message.trim(),
        user_id: user?.id ?? null,
      });

      if (insertErr) throw new Error(insertErr.message);

      setDone(true);
      setForm(EMPTY);
      toast('Message envoyé. Nous vous répondrons bientôt.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="contact-success">
        <div className="icon">✦</div>
        <h3>Merci !</h3>
        <p>
          Votre message a bien été reçu.<br />
          Nous reviendrons vers vous très vite.
        </p>
        <button type="button" className="btn" onClick={() => setDone(false)}>
          ENVOYER UN AUTRE MESSAGE
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      {error && <div className="error">{error}</div>}

      <div className="row">
        <input
          type="text"
          placeholder="Votre nom *"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          required
          autoComplete="name"
        />
        <input
          type="email"
          placeholder="Votre email *"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <input
        type="text"
        placeholder="Objet"
        value={form.subject}
        onChange={(e) => update('subject', e.target.value)}
      />

      <textarea
        placeholder="Votre message *"
        value={form.message}
        onChange={(e) => update('message', e.target.value)}
        rows={6}
        required
      />

      <button type="submit" className="btn btn-dark btn-loading" disabled={submitting}>
        {submitting ? (
          <>
            <Spinner /> ENVOI…
          </>
        ) : (
          'ENVOYER LE MESSAGE'
        )}
      </button>
    </form>
  );
}
