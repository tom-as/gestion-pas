import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';

/* ── Tipos ──────────────────────────────────────────────── */
export type NotifSeverity = 'alert' | 'warn' | 'info';

export interface NotifItem {
  id:       string;
  title:    string;
  sub:      string;
  href:     string;
  severity: NotifSeverity;
}

/* ── Respuestas de API ──────────────────────────────────── */
interface SiniestrosResp { porEstado: Record<string, number> }
interface ReclamosResp   { porEstado: Record<string, number> }
interface VencResp {
  total: number;
  cuotas: { id: string; importe: number; fechaVencimiento: string; poliza: { asegurado?: string | null } }[];
}
interface IncompletosResp { total: number }

const STALE = 2 * 60 * 1000; // 2 min
const LS_KEY = 'gp-notif-last-seen';

/* ── Hook ───────────────────────────────────────────────── */
export function useNotificaciones() {
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const v = localStorage.getItem(LS_KEY);
    return v ? parseInt(v, 10) : 0;
  });

  const siniestros   = useQuery<SiniestrosResp>({
    queryKey: ['notif', 'siniestros'],
    queryFn: () => api.get('/reportes/siniestros').then((r) => r.data),
    staleTime: STALE,
  });
  const reclamos     = useQuery<ReclamosResp>({
    queryKey: ['notif', 'reclamos'],
    queryFn: () => api.get('/reportes/reclamos').then((r) => r.data),
    staleTime: STALE,
  });
  const vencimientos = useQuery<VencResp>({
    queryKey: ['notif', 'vencimientos'],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
    staleTime: STALE,
  });
  const incompletos  = useQuery<IncompletosResp>({
    queryKey: ['notif', 'incompletos'],
    queryFn: () => api.get('/reportes/datos-incompletos').then((r) => r.data),
    staleTime: STALE,
  });

  /* Construir lista de items ───────────────────────────── */
  const items: NotifItem[] = [];

  const sinAbiertos = siniestros.data?.porEstado?.['abierto'] ?? 0;
  if (sinAbiertos > 0) {
    items.push({
      id: 'sin-abiertos',
      title: `${sinAbiertos} siniestro${sinAbiertos > 1 ? 's' : ''} abierto${sinAbiertos > 1 ? 's' : ''}`,
      sub: 'Requieren atención',
      href: '/siniestros',
      severity: 'alert',
    });
  }

  const recAbiertos = reclamos.data?.porEstado?.['abierto'] ?? 0;
  if (recAbiertos > 0) {
    items.push({
      id: 'rec-abiertos',
      title: `${recAbiertos} reclamo${recAbiertos > 1 ? 's' : ''} abierto${recAbiertos > 1 ? 's' : ''}`,
      sub: 'Sin gestionar',
      href: '/reclamos',
      severity: 'warn',
    });
  }

  if ((vencimientos.data?.total ?? 0) > 0) {
    const n = vencimientos.data!.total;
    items.push({
      id: 'vencimientos',
      title: `${n} cuota${n > 1 ? 's' : ''} vence${n > 1 ? 'n' : ''} en 7 días`,
      sub: vencimientos.data!.cuotas[0]?.poliza?.asegurado ?? 'Ver vencimientos',
      href: '/reportes',
      severity: 'warn',
    });
  }

  if ((incompletos.data?.total ?? 0) > 0) {
    items.push({
      id: 'incompletos',
      title: `${incompletos.data!.total} bien${incompletos.data!.total > 1 ? 'es' : ''} con datos incompletos`,
      sub: 'Completar información',
      href: '/bienes',
      severity: 'info',
    });
  }

  /* Unread — hay items y el usuario no abrió el panel desde que se cargaron */
  const dataUpdatedAt = Math.max(
    siniestros.dataUpdatedAt ?? 0,
    reclamos.dataUpdatedAt ?? 0,
    vencimientos.dataUpdatedAt ?? 0,
    incompletos.dataUpdatedAt ?? 0,
  );
  const hasUnread = items.length > 0 && dataUpdatedAt > lastSeen;

  function markAsRead() {
    const now = Date.now();
    localStorage.setItem(LS_KEY, String(now));
    setLastSeen(now);
  }

  const isLoading = siniestros.isLoading || reclamos.isLoading
    || vencimientos.isLoading || incompletos.isLoading;

  return { items, hasUnread, markAsRead, isLoading };
}
