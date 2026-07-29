import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  identificadorAcceso: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormValues = z.infer<typeof schema>;

/* ── Ícono de escudo SVG ── */
function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.identificadorAcceso, values.password);
    } catch {
      setServerError('Credenciales inválidas. Revisá email y contraseña.');
    }
  };

  return (
    /* Fondo exterior muy oscuro */
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse 80% 70% at 50% -5%, rgba(61,107,255,0.12) 0%, transparent 60%), #070b14' }}
    >
      {/* Card principal — split 2 columnas */}
      <div
        className="w-full max-w-[860px] min-h-[520px] rounded-2xl overflow-hidden flex animate-fade-in-up"
        style={{
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Panel izquierdo — branding ────────────────── */}
        <div
          className="hidden md:flex w-[42%] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(155deg, #161d2f 0%, #1a2035 60%, #131929 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Subtle glow blob */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(61,107,255,0.12) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }}
          />

          {/* Logo */}
          <div>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-accent-400 mb-8"
              style={{
                background: 'rgba(61,107,255,0.12)',
                border: '1px solid rgba(61,107,255,0.25)',
              }}
            >
              <ShieldIcon />
            </div>

            <h1 className="text-[26px] font-bold text-white leading-tight mb-3 tracking-tight">
              Gestión PAS
            </h1>
            <p className="text-slate-400 text-[15px] leading-relaxed">
              Administración de asegurados, pólizas y siniestros para productores.
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3">
            {[
              'Gestión de cartera unificada',
              'Control de siniestros y reclamos',
              'Reportes en tiempo real',
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />
                <span className="text-slate-500 text-sm">{feat}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div>
            <p className="text-slate-600 text-xs">© 2026 Gestión PAS</p>
          </div>
        </div>

        {/* ── Panel derecho — formulario ─────────────────── */}
        <div
          className="flex-1 flex flex-col justify-center px-10 py-12"
          style={{ background: '#0f1623' }}
        >
          {/* Mobile logo (solo en < md) */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-accent-400"
              style={{ background: 'rgba(61,107,255,0.12)', border: '1px solid rgba(61,107,255,0.2)' }}
            >
              <ShieldIcon />
            </div>
            <span className="font-bold text-white text-base">Gestión PAS</span>
          </div>

          <h2 className="text-[22px] font-bold text-white tracking-tight mb-1">
            Iniciar sesión
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Ingresá con tu cuenta de productor
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm text-slate-400">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="usuario@gestionpas.com.ar"
                className={`w-full px-4 py-3 text-sm rounded-xl outline-none transition-all duration-200
                  text-slate-200 placeholder:text-slate-600
                  ${errors.identificadorAcceso
                    ? 'ring-1 ring-red-500/50 bg-red-500/5'
                    : 'focus:ring-1 focus:ring-accent-500/50'
                  }`}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: errors.identificadorAcceso
                    ? '1px solid rgba(239,68,68,0.4)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
                {...register('identificadorAcceso')}
              />
              {errors.identificadorAcceso && (
                <p className="text-xs text-red-400">{errors.identificadorAcceso.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-sm text-slate-400">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 text-sm rounded-xl outline-none transition-all duration-200
                    text-slate-200 placeholder:text-slate-600 pr-11
                    ${errors.password
                      ? 'ring-1 ring-red-500/50 bg-red-500/5'
                      : 'focus:ring-1 focus:ring-accent-500/50'
                    }`}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: errors.password
                      ? '1px solid rgba(239,68,68,0.4)'
                      : '1px solid rgba(255,255,255,0.1)',
                  }}
                  {...register('password')}
                />
                {/* Toggle visibilidad */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Error de servidor */}
            {serverError && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {serverError}
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-40 active:scale-[0.98]"
              style={{
                background: isSubmitting
                  ? 'rgba(61,107,255,0.5)'
                  : 'rgba(61,107,255,1)',
                border: '1px solid rgba(61,107,255,0.6)',
                boxShadow: isSubmitting ? 'none' : '0 0 0 1px rgba(61,107,255,0.3), 0 4px 20px rgba(61,107,255,0.25)',
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Ingresando…
                </span>
              ) : 'Ingresar'}
            </button>

            {/* Forgot password (visual solamente) */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm transition-colors"
                style={{ color: 'rgba(61,107,255,0.8)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(61,107,255,1)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(61,107,255,0.8)')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
