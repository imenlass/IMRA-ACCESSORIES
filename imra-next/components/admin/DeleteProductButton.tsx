'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProductAction } from '@/app/admin/products/actions';
import Spinner from '@/components/Spinner';

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!confirm(`Supprimer définitivement "${name}" ?`)) return;
    startTransition(async () => {
      try {
        await deleteProductAction(id);
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
      {pending ? <Spinner size={12} /> : 'Supprimer'}
    </button>
  );
}
