'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Props = {
  label: string;
  /** Query-string key for the lower bound. */
  paramMin: string;
  /** Query-string key for the upper bound. */
  paramMax: string;
  /** Unit suffix shown after the inputs (DT, etc.). */
  unit?: string;
  /** Optional step for the number input. */
  step?: number | string;
};

export default function AdminRangeFilter({
  label,
  paramMin,
  paramMax,
  unit,
  step,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [minVal, setMinVal] = useState(params.get(paramMin) ?? '');
  const [maxVal, setMaxVal] = useState(params.get(paramMax) ?? '');

  // Sync if URL changes externally
  useEffect(() => {
    setMinVal(params.get(paramMin) ?? '');
    setMaxVal(params.get(paramMax) ?? '');
  }, [params, paramMin, paramMax]);

  // Debounced URL update
  useEffect(() => {
    const h = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (minVal.trim()) sp.set(paramMin, minVal.trim());
      else sp.delete(paramMin);
      if (maxVal.trim()) sp.set(paramMax, maxVal.trim());
      else sp.delete(paramMax);

      // Only navigate if anything actually changed
      const currentQs = params.toString();
      const newQs = sp.toString();
      if (currentQs !== newQs) {
        router.replace(`${pathname}${newQs ? `?${newQs}` : ''}`);
      }
    }, 400);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal]);

  return (
    <div className="adv-field">
      <label className="adv-field-label">{label}</label>
      <div className="adv-field-row">
        <input
          type="number"
          value={minVal}
          onChange={(e) => setMinVal(e.target.value)}
          placeholder="min"
          step={step}
          inputMode="decimal"
        />
        <span className="dash">–</span>
        <input
          type="number"
          value={maxVal}
          onChange={(e) => setMaxVal(e.target.value)}
          placeholder="max"
          step={step}
          inputMode="decimal"
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
}
