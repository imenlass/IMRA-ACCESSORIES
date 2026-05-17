'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatusAction, deleteOrderAction } from '@/app/admin/orders/actions';
import Spinner from '@/components/Spinner';

type Status = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_LABEL: Record<Status, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const FLOW: Status[] = ['pending', 'confirmed', 'shipped', 'delivered'];

const PRIMARY_ACTION: Partial<Record<Status, { target: Status; label: string; icon: string }>> = {
  pending:   { target: 'confirmed', label: 'Confirmer la commande',       icon: '✓' },
  confirmed: { target: 'shipped',   label: 'Marquer comme expédiée',      icon: '◈' },
  shipped:   { target: 'delivered', label: 'Marquer comme livrée',        icon: '✦' },
  cancelled: { target: 'pending',   label: 'Restaurer la commande',       icon: '↻' },
};

const ALL_STATUSES: Status[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrderStatusManager({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: Status;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showOverride, setShowOverride] = useState(false);

  function changeTo(next: Status) {
    if (next === status || pending) return;
    const prev = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, next);
        router.refresh();
      } catch (err) {
        setStatus(prev);
        setError(err instanceof Error ? err.message : 'Échec de la mise à jour.');
      }
    });
  }

  function onCancel() {
    if (!confirm('Annuler cette commande ? Vous pourrez la restaurer ensuite.')) return;
    changeTo('cancelled');
  }

  function onDelete() {
    if (
      !confirm(
        `Supprimer DÉFINITIVEMENT la commande #${orderId.slice(0, 8).toUpperCase()} ? Cette action est irréversible.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteOrderAction(orderId);
        router.push('/admin/orders');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Échec de la suppression.');
      }
    });
  }

  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered';
  const currentIdx = FLOW.indexOf(status);
  const primary = PRIMARY_ACTION[status];
  const canCancel = !isCancelled && !isDelivered;

  return (
    <div className="status-manager">
      {error && <div className="admin-error">{error}</div>}

      {/* ─── Visual stepper ─── */}
      <div className={`status-stepper ${isCancelled ? 'is-cancelled' : ''}`}>
        {FLOW.map((step, i) => {
          const isPast = !isCancelled && i < currentIdx;
          const isCurrent = !isCancelled && i === currentIdx;
          const classes = [
            'status-step',
            isPast ? 'is-past' : '',
            isCurrent ? 'is-current' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={step}
              type="button"
              className={classes}
              onClick={() => changeTo(step)}
              disabled={pending}
              title={`Définir comme: ${STATUS_LABEL[step]}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className="dot">{isPast ? '✓' : i + 1}</span>
              <span className="label">{STATUS_LABEL[step]}</span>
            </button>
          );
        })}
      </div>

      {isCancelled && (
        <div className="status-banner status-banner-cancelled">
          <span>◆</span>
          Cette commande est annulée.
        </div>
      )}
      {isDelivered && (
        <div className="status-banner status-banner-delivered">
          <span>✦</span>
          Commande livrée. Aucune action requise.
        </div>
      )}

      {/* ─── Primary CTA — next step in the flow ─── */}
      {primary && (
        <button
          type="button"
          className="btn btn-dark btn-loading status-primary"
          onClick={() => changeTo(primary.target)}
          disabled={pending}
        >
          {pending ? (
            <>
              <Spinner /> EN COURS…
            </>
          ) : (
            <>
              <span className="icon">{primary.icon}</span>
              {primary.label.toUpperCase()}
            </>
          )}
        </button>
      )}

      {/* ─── Secondary: cancel ─── */}
      {canCancel && (
        <button
          type="button"
          className="status-cancel-btn"
          onClick={onCancel}
          disabled={pending}
        >
          Annuler la commande
        </button>
      )}

      {/* ─── Manual override ─── */}
      <div className="status-override">
        <button
          type="button"
          className={`status-override-toggle ${showOverride ? 'open' : ''}`}
          onClick={() => setShowOverride((v) => !v)}
          aria-expanded={showOverride}
        >
          <span className="caret">{showOverride ? '−' : '+'}</span>
          Modifier le statut manuellement
        </button>
        {showOverride && (
          <div className="status-override-body">
            <p className="hint">
              Clic pour assigner un statut directement (utile en cas de correction).
            </p>
            <div className="status-pill-row">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`status-pill ${s} ${status === s ? 'is-active' : ''}`}
                  onClick={() => changeTo(s)}
                  disabled={pending || status === s}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Danger zone ─── */}
      <div className="status-danger-zone">
        <div className="dz-label">Zone dangereuse</div>
        <button
          type="button"
          className="dz-action"
          onClick={onDelete}
          disabled={pending}
        >
          Supprimer définitivement la commande
        </button>
      </div>
    </div>
  );
}
