import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

/* ── Tipos ──────────────────────────────────────────────── */
interface SearchResult {
  id:       string;
  label:    string;
  sub:      string;
  href:     string;
  category: string;
}

/* ── Nav pages — búsqueda estática ──────────────────────── */
const NAV_PAGES: SearchResult[] = [
  { id: 'nav-dashboard',   label: 'Inicio',       sub: 'Dashboard principal',      href: '/dashboard',   category: 'Páginas' },
  { id: 'nav-asegurados',  label: 'Asegurados',   sub: 'Lista de asegurados',       href: '/asegurados',  category: 'Páginas' },
  { id: 'nav-polizas',     label: 'Pólizas',      sub: 'Gestión de pólizas',        href: '/polizas',     category: 'Páginas' },
  { id: 'nav-siniestros',  label: 'Siniestros',   sub: 'Gestión de siniestros',     href: '/siniestros',  category: 'Páginas' },
  { id: 'nav-reclamos',    label: 'Reclamos',      sub: 'Gestión de reclamos',       href: '/reclamos',    category: 'Páginas' },
  { id: 'nav-bienes',      label: 'Bienes',        sub: 'Bienes asegurados',         href: '/bienes',      category: 'Páginas' },
  { id: 'nav-documentos',  label: 'Documentos',   sub: 'Repositorio de documentos', href: '/documentos',  category: 'Páginas' },
  { id: 'nav-productores', label: 'Productores',  sub: 'Gestión de productores',    href: '/productores', category: 'Páginas' },
  { id: 'nav-companias',   label: 'Compañías',    sub: 'Compañías aseguradoras',    href: '/companias',   category: 'Páginas' },
  { id: 'nav-reportes',    label: 'Reportes',     sub: 'Reportes y estadísticas',   href: '/reportes',    category: 'Páginas' },
];

/* ── Debounce hook ──────────────────────────────────────── */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Normalizar texto para comparación ─────────────────── */
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* ── Agrupar resultados por categoría ───────────────────── */
function groupBy(results: SearchResult[]): { category: string; items: SearchResult[] }[] {
  const map = new Map<string, SearchResult[]>();
  for (const r of results) {
    if (!map.has(r.category)) map.set(r.category, []);
    map.get(r.category)!.push(r);
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
}

/* ── Categoría icon ─────────────────────────────────────── */
const CAT_ICON: Record<string, React.ReactNode> = {
  Asegurados: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  Pólizas:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Siniestros: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>,
  Páginas:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
};

/* ════════════════════════════════════════════════════════════
   GlobalSearch
════════════════════════════════════════════════════════════ */
export default function GlobalSearch() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const inputRef  = useRef<HTMLInputElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  const [open,        setOpen]        = useState(false);
  const [query,       setQuery]       = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  /* Abrir con tecla "/" ────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Focus input cuando se abre ─────────────────────────── */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  /* Búsqueda de asegurados via API ─────────────────────── */
  const { data: aseguradosData, isFetching: fetchingAsegurados } = useQuery<{ id: string; nombre: string; dniCuil: string }[]>({
    queryKey: ['global-search', 'asegurados', debouncedQuery],
    queryFn:  () => api.get(`/asegurados?search=${encodeURIComponent(debouncedQuery)}`).then((r) => r.data),
    enabled:  debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  /* Búsqueda client-side sobre cache de pólizas ─────────── */
  const polizasCache = qc.getQueryData<{ id: string; numeroPoliza: string; asegurado: { nombre: string } }[]>(['polizas']);
  const siniestrosCache = qc.getQueryData<{ id: string; tipo: string; asegurado: { nombre: string } }[]>(['siniestros']);

  /* Construir resultados ───────────────────────────────── */
  const results: SearchResult[] = [];

  if (debouncedQuery.length >= 2) {
    const q = norm(debouncedQuery);

    /* Asegurados */
    for (const a of aseguradosData ?? []) {
      if (results.filter((r) => r.category === 'Asegurados').length >= 4) break;
      results.push({ id: `a-${a.id}`, label: a.nombre, sub: a.dniCuil, href: `/asegurados/${a.id}`, category: 'Asegurados' });
    }

    /* Pólizas — client-side */
    for (const p of polizasCache ?? []) {
      if (results.filter((r) => r.category === 'Pólizas').length >= 3) break;
      if (norm(p.numeroPoliza).includes(q) || norm(p.asegurado?.nombre ?? '').includes(q)) {
        results.push({ id: `p-${p.id}`, label: p.numeroPoliza, sub: p.asegurado?.nombre ?? '—', href: `/polizas/${p.id}`, category: 'Pólizas' });
      }
    }

    /* Siniestros — client-side */
    for (const s of siniestrosCache ?? []) {
      if (results.filter((r) => r.category === 'Siniestros').length >= 3) break;
      if (norm(s.tipo).includes(q) || norm(s.asegurado?.nombre ?? '').includes(q)) {
        results.push({ id: `s-${s.id}`, label: s.tipo.replace(/_/g, ' '), sub: s.asegurado?.nombre ?? '—', href: `/siniestros/${s.id}`, category: 'Siniestros' });
      }
    }

    /* Páginas */
    for (const p of NAV_PAGES) {
      if (norm(p.label).includes(q) || norm(p.sub).includes(q)) {
        results.push(p);
      }
    }
  } else if (open) {
    /* Sin query — mostrar páginas como sugerencias */
    results.push(...NAV_PAGES.slice(0, 5));
  }

  const groups   = groupBy(results);
  const flatList = groups.flatMap((g) => g.items);

  /* Navegación por teclado ─────────────────────────────── */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatList[activeIndex]) {
      navigate(flatList[activeIndex].href);
      close();
    } else if (e.key === 'Escape') {
      close();
    }
  }

  const close = useCallback(() => setOpen(false), []);

  /* Reset activeIndex al cambiar query */
  useEffect(() => { setActiveIndex(0); }, [debouncedQuery]);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="relative">

      {/* Trigger / input */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-4 h-9 rounded-xl w-72 text-left transition-colors hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <span className="text-sm flex-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Buscar...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }}>/</kbd>
        </button>
      ) : (
        <div
          className="flex items-center gap-2.5 px-4 h-9 rounded-xl w-72"
          style={{ background: 'rgba(61,107,255,0.08)', border: '1px solid rgba(61,107,255,0.35)' }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar asegurados, pólizas..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] min-w-0"
          />
          {(fetchingAsegurados) && (
            <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          )}
        </div>
      )}

      {/* Overlay de cierre */}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} />

            {/* Dropdown */}
            <motion.div
              ref={panelRef}
              className="absolute left-0 z-50 overflow-hidden"
              style={{
                top: 'calc(100% + 8px)',
                width: 360,
                background: 'linear-gradient(180deg, #131929 0%, #0f1623 100%)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '0.5rem',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)',
              }}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Grupos de resultados */}
              {groups.length === 0 && debouncedQuery.length >= 2 && !fetchingAsegurados && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Sin resultados para «{debouncedQuery}»
                  </p>
                </div>
              )}

              {groups.map(({ category, items }) => {
                const icon = CAT_ICON[category];
                return (
                  <div key={category}>
                    {/* Category header */}
                    <div
                      className="flex items-center gap-2 px-4 py-2"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span style={{ color: 'rgba(255,255,255,0.25)' }}>{icon}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {category}
                      </span>
                    </div>

                    {/* Items */}
                    {items.map((item) => {
                      const globalIdx = flatList.indexOf(item);
                      const isActive  = globalIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { navigate(item.href); close(); }}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-none"
                          style={{
                            background: isActive ? 'rgba(61,107,255,0.1)' : 'transparent',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate" style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.75)' }}>
                              {item.label}
                            </p>
                            <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {item.sub}
                            </p>
                          </div>
                          {isActive && (
                            <kbd className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}

              {/* Footer */}
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {[['↑↓', 'navegar'], ['↵', 'abrir'], ['Esc', 'cerrar']].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1">
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>{key}</kbd>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
