import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/* ── Tipos ──────────────────────────────────────────────── */
export type NotifSeverity = 'alert' | 'warn' | 'info';

export interface NotifItem {
  id:       string;
  title:    string;
  sub:      string;
  href:     string;
  severity: NotifSeverity;
  leida?:   boolean;
}

/* ── Respuestas de API ──────────────────────────────────── */
interface NotificacionApi {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo: string | null;
  href: string;
  leida: boolean;
  creadaEn: string;
}

interface VencResp {
  total: number;
  cuotas: { id: string; importe: number; fechaVencimiento: string; poliza: { asegurado?: string | null } }[];
}
interface IncompletosResp { total: number }

const STALE = 60 * 1000; // 1 min

/* ── Mapa de severidad por tipo ─────────────────────────── */
const TIPO_SEV: Record<string, NotifSeverity> = {
  comentario_reclamo:   'info',
  estado_reclamo:       'warn',
  comentario_siniestro: 'info',
  estado_siniestro:     'alert',
};

/* ── Hook ───────────────────────────────────────────────── */
export function useNotificaciones() {
  const qc = useQueryClient();

  /* Notificaciones de tickets (base de datos) */
  const notifQuery = useQuery<NotificacionApi[]>({
    queryKey: ['notificaciones', 'no-leidas'],
    queryFn: () => api.get('/notificaciones/no-leidas').then((r) => r.data),
    staleTime: STALE,
    refetchInterval: 30_000, // polling cada 30s
  });

  /* Notificaciones de dashboard (reportes) — seguimos mostrando vencimientos e incompletos */
  const vencimientos = useQuery<VencResp>({
    queryKey: ['notif', 'vencimientos'],
    queryFn: () => api.get('/reportes/vencimientos-proximos?dias=7').then((r) => r.data),
    staleTime: STALE,
  });
  const incompletos = useQuery<IncompletosResp>({
    queryKey: ['notif', 'incompletos'],
    queryFn: () => api.get('/reportes/datos-incompletos').then((r) => r.data),
    staleTime: STALE,
  });

  /* Construir lista de items ────────────────────────────── */
  const items: NotifItem[] = [];

  // 1) Notificaciones de tickets (DB) — solo no leídas
  for (const n of notifQuery.data ?? []) {
    items.push({
      id:       n.id,
      title:    n.titulo,
      sub:      n.subtitulo ?? '',
      href:     n.href,
      severity: TIPO_SEV[n.tipo] ?? 'info',
      leida:    n.leida,
    });
  }

  // 2) Vencimientos próximos
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

  // 3) Bienes con datos incompletos
  if ((incompletos.data?.total ?? 0) > 0) {
    items.push({
      id: 'incompletos',
      title: `${incompletos.data!.total} bien${incompletos.data!.total > 1 ? 'es' : ''} con datos incompletos`,
      sub: 'Completar información',
      href: '/bienes',
      severity: 'info',
    });
  }

  const hasUnread = (notifQuery.data?.length ?? 0) > 0;

  /* Mutación: marcar todas leídas */
  const marcarTodas = useMutation({
    mutationFn: () => api.patch('/notificaciones/leer-todas'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  /* Mutación: marcar una leída */
  const marcarUna = useMutation({
    mutationFn: (id: string) => api.patch(`/notificaciones/${id}/leer`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  function markAsRead() {
    if ((notifQuery.data?.length ?? 0) > 0) {
      marcarTodas.mutate();
    }
  }

  const isLoading = notifQuery.isLoading || vencimientos.isLoading || incompletos.isLoading;

  return { items, hasUnread, markAsRead, markOneAsRead: marcarUna.mutate, isLoading };
}
