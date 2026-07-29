export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h1>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 text-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span className="font-medium">Módulo en construcción — próxima etapa</span>
      </div>
    </div>
  );
}
