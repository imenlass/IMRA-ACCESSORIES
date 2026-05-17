'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type Option = { value: string; label: string };

type Props = {
  label: string;
  param: string;
  options: Option[];
  placeholder?: string;
};

export default function AdminSelectFilter({
  label,
  param,
  options,
  placeholder = 'Toutes',
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? '';

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sp = new URLSearchParams(params.toString());
    if (e.target.value) sp.set(param, e.target.value);
    else sp.delete(param);
    router.replace(`${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`);
  }

  return (
    <div className="adv-field">
      <label className="adv-field-label">{label}</label>
      <select className="adv-select" value={current} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
