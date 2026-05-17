'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  label?: string;
  paramFrom?: string;
  paramTo?: string;
};

export default function AdminDateRangeFilter({
  label = 'Période',
  paramFrom = 'from',
  paramTo = 'to',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [from, setFrom] = useState(params.get(paramFrom) ?? '');
  const [to, setTo] = useState(params.get(paramTo) ?? '');

  useEffect(() => {
    setFrom(params.get(paramFrom) ?? '');
    setTo(params.get(paramTo) ?? '');
  }, [params, paramFrom, paramTo]);

  useEffect(() => {
    const sp = new URLSearchParams(params.toString());
    if (from) sp.set(paramFrom, from);
    else sp.delete(paramFrom);
    if (to) sp.set(paramTo, to);
    else sp.delete(paramTo);
    const currentQs = params.toString();
    const newQs = sp.toString();
    if (currentQs !== newQs) {
      router.replace(`${pathname}${newQs ? `?${newQs}` : ''}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  function presetLastDays(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
  }

  function clear() {
    setFrom('');
    setTo('');
  }

  return (
    <div className="adv-field">
      <label className="adv-field-label">{label}</label>
      <div className="adv-field-row">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Du"
        />
        <span className="dash">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Au"
        />
      </div>
      <div className="adv-field-presets">
        <button type="button" onClick={() => presetLastDays(7)}>7 jours</button>
        <button type="button" onClick={() => presetLastDays(30)}>30 jours</button>
        <button type="button" onClick={() => presetLastDays(90)}>90 jours</button>
        {(from || to) && (
          <button type="button" className="clear" onClick={clear}>Effacer</button>
        )}
      </div>
    </div>
  );
}
