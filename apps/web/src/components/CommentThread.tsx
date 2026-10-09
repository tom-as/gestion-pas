import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn, cls } from '@/lib/cn';

/* ── Tipos ──────────────────────────────────────────────── */
interface AutorRef {
  id: string;
  perfil: string;
  /** Puede venir del autor como identificadorAcceso o construirse del asegurado/productor */
  identificadorAcceso?: string;
}

interface Comentario {
  id: string;
  texto: string;
  creadoEn: string;
  autor: AutorRef;
}

interface Props {
  /** 'reclamos' o 'siniestros' */
  entidad: 'reclamos' | 'siniestros';
  entidadId: string;
  /** Nombre del asegurado (para mostrar en mensajes del otro lado) */
  nombreAsegurado?: string;
  /** Nombre del productor (para mostrar en mensajes del otro lado) */
  nombreProductor?: string;
}

/* ── Formato de hora ─────────────────────────────────────── */
function fmtFechaHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Burbuja de comentario ───────────────────────────────── */
function Burbuja({ comentario, esPropio }: { comentario: Comentario; esPropio: boolean }) {
  const perfil = comentario.autor.perfil;
  const nombre =
    perfil === 'asegurado' ? 'Asegurado'
    : perfil === 'productor' ? 'Productor'
    : 'Organizador';

  return (
    <div className={cn('flex flex-col gap-1 max-w-[75%]', esPropio ? 'self-end items-end' : 'self-start items-start')}>
      <span className="text-[11px] txt-faint font-medium px-1">
        {nombre} · {fmtFechaHora(comentario.creadoEn)}
      </span>
      <div
        className={cn(
          'px-4 py-2.5 rounded-xl text-sm leading-relaxed',
          esPropio
            ? 'bg-accent-600/20 border border-accent-500/25 txt-primary rounded-br-sm'
            : 'bg-white/4 border border-white/8 txt-secondary rounded-bl-sm',
        )}
      >
        {comentario.texto}
      </div>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────── */
export default function CommentThread({ entidad, entidadId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [texto, setTexto] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const queryKey = ['comentarios', entidad, entidadId];

  const { data: comentarios = [], isLoading } = useQuery<Comentario[]>({
    queryKey,
    queryFn: () => api.get(`/${entidad}/${entidadId}/comentarios`).then((r) => r.data),
    refetchInterval: 15_000, // refresca cada 15s para simular "live"
  });

  // Scroll al fondo cuando llegan nuevos comentarios
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comentarios.length]);

  const mutation = useMutation({
    mutationFn: (t: string) =>
      api.post(`/${entidad}/${entidadId}/comentarios`, { texto: t }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setTexto('');
    },
  });

  function handleSend() {
    const trimmed = texto.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="surface rounded-sm overflow-hidden mt-5">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/6">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="txt-faint">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h2 className="text-sm font-semibold txt-primary">Comentarios</h2>
        {comentarios.length > 0 && (
          <span className="ml-auto text-[11px] txt-faint tabular-nums">{comentarios.length}</span>
        )}
      </div>

      {/* Hilo */}
      <div
        className="flex flex-col gap-3 px-5 py-4 overflow-y-auto"
        style={{ minHeight: 120, maxHeight: 340 }}
      >
        {isLoading && (
          <p className="text-center text-sm txt-tertiary py-4">Cargando comentarios...</p>
        )}
        {!isLoading && comentarios.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 txt-faint">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-xs txt-faint">Sin comentarios todavía. ¡Sé el primero!</p>
          </div>
        )}
        {comentarios.map((c) => (
          <Burbuja
            key={c.id}
            comentario={c}
            esPropio={c.autor.perfil === user?.perfil}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/6 px-4 py-3 flex gap-2 items-end">
        <textarea
          className={cn(cls.textarea, 'flex-1 !rounded-md text-[14px]')}
          rows={2}
          placeholder="Escribí un comentario… (Enter para enviar, Shift+Enter para nueva línea)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={2000}
          disabled={mutation.isPending}
        />
        <button
          className={cn(cls.btn, cls.btnMd, cls.btnPrimary, 'self-end')}
          onClick={handleSend}
          disabled={!texto.trim() || mutation.isPending}
        >
          {mutation.isPending ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
          Enviar
        </button>
      </div>
    </div>
  );
}
