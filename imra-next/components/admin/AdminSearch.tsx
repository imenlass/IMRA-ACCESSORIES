'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  placeholder?: string;
  /** Query-string key. Defaults to "q". */
  paramName?: string;
  /** Debounce in ms while typing. Defaults to 350. */
  debounceMs?: number;
};

export default function AdminSearch({
  placeholder = 'Rechercher…',
  paramName = 'q',
  debounceMs = 350,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = params.get(paramName) ?? '';
  const [value, setValue] = useState(initial);

  // Keep state in sync if URL is changed externally (e.g. reset button)
  useEffect(() => {
    setValue(params.get(paramName) ?? '');
  }, [params, paramName]);

  // Push to URL after debounce
  useEffect(() => {
    if (value === (params.get(paramName) ?? '')) return;
    const h = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      const trimmed = value.trim();
      if (trimmed) sp.set(paramName, trimmed);
      else sp.delete(paramName);
      router.replace(`${pathname}?${sp.toString()}`);
    }, debounceMs);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="admin-search">
      <svg
        className="admin-search-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.5-4.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className="admin-search-clear"
          aria-label="Effacer la recherche"
          onClick={() => setValue('')}
        >
          ×
        </button>
      )}
    </div>
  );
}
