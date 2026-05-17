'use client';

import { useState } from 'react';

type Faq = { id: string; question: string; answer: string };

export default function FaqAccordion({ items }: { items: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) {
    return (
      <p style={{ color: '#888', textAlign: 'center', padding: 30 }}>
        Aucune question pour le moment.
      </p>
    );
  }

  return (
    <div className="faq-list">
      {items.map((f) => {
        const open = openId === f.id;
        return (
          <div key={f.id} className={`faq-item ${open ? 'open' : ''}`}>
            <button
              type="button"
              className="faq-q"
              onClick={() => setOpenId(open ? null : f.id)}
              aria-expanded={open}
            >
              <span dangerouslySetInnerHTML={{ __html: f.question }} />
              <span className="faq-icon" aria-hidden="true">
                {open ? '−' : '+'}
              </span>
            </button>
            <div className="faq-a-wrap" aria-hidden={!open}>
              <div className="faq-a" dangerouslySetInnerHTML={{ __html: f.answer }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
