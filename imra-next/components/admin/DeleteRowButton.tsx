'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/Spinner';

type Props = {
  /** Server action — imported reference (NOT a closure). */
  action: (id: string) => Promise<void>;
  id: string;
  confirmMessage: string;
  label?: string;
};

export default function DeleteRowButton({ action, id, confirmMessage, label = 'Supprimer' }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        await action(id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Échec de la suppression.');
      }
    });
  }

  return (
    <button
      type="button"
      className="admin-link admin-danger"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? <Spinner size={12} /> : label}
    </button>
  );
}
