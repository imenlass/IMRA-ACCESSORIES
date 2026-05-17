'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  toggleMessageHandledAction,
  deleteMessageAction,
} from '@/app/admin/messages/actions';
import Spinner from '@/components/Spinner';

export default function MessageActions({
  id,
  handled,
}: {
  id: string;
  handled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticHandled, setOptimisticHandled] = useState(handled);

  function toggle() {
    const next = !optimisticHandled;
    setOptimisticHandled(next);
    startTransition(async () => {
      try {
        await toggleMessageHandledAction(id, next);
        router.refresh();
      } catch {
        setOptimisticHandled(!next);
      }
    });
  }

  function onDelete() {
    if (!confirm('Supprimer ce message ?')) return;
    startTransition(async () => {
      try {
        await deleteMessageAction(id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Échec.');
      }
    });
  }

  return (
    <div className="admin-row-actions">
      <button
        type="button"
        className={`admin-link ${optimisticHandled ? 'admin-dim' : ''}`}
        onClick={toggle}
        disabled={pending}
      >
        {pending ? (
          <Spinner size={12} />
        ) : optimisticHandled ? (
          'Marquer non lu'
        ) : (
          'Marquer lu'
        )}
      </button>
      <button
        type="button"
        className="admin-link admin-danger"
        onClick={onDelete}
        disabled={pending}
      >
        Supprimer
      </button>
    </div>
  );
}
