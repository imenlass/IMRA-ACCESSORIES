'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  children: ReactNode;
  /** Params controlled by the advanced panel. Reset clears these. */
  controlledParams: string[];
  /** Params that should NEVER be cleared (e.g. permanent tab like status). Optional. */
  keepParams?: string[];
};

export default function AdminAdvancedFilters({
  children,
  controlledParams,
  keepParams = [],
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  // How many controlled params are actually set?
  const activeCount = controlledParams.reduce(
    (n, key) => (params.get(key) ? n + 1 : n),
    0
  );

  function resetControlled() {
    const sp = new URLSearchParams();
    keepParams.forEach((k) => {
      const v = params.get(k);
      if (v) sp.set(k, v);
    });
    router.replace(`${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`);
  }

  return (
    <div className={`adv-filters ${open ? 'is-open' : ''}`}>
      <div className="adv-filters-bar">
        <button
          type="button"
          className="adv-filters-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="caret">{open ? '−' : '+'}</span>
          Filtres avancés
          {activeCount > 0 && <span className="badge">{activeCount}</span>}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            className="adv-filters-reset"
            onClick={resetControlled}
            title="Réinitialiser tous les filtres avancés"
          >
            Réinitialiser
          </button>
        )}
      </div>
      {open && <div className="adv-filters-body">{children}</div>}
    </div>
  );
}
