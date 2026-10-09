import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import LogoG from '@/components/ui/LogoG';

const schema = z.object({
  identificadorAcceso: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // El LoginPage vive fuera del AppLayout (que es quien normalmente aplica
  // la clase `dark`). Lo aplicamos aquí directamente, respetando la
  // preferencia guardada en localStorage (mismo key que useDarkMode).
  useEffect(() => {
    const stored = localStorage.getItem('gestion-pas-dark');
    // Default dark-first (igual que useDarkMode)
    const isDark = stored !== null ? stored === 'true' : true;
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

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
      style={{ background: 'var(--surface-app)' }}
    >
      {/* Card principal — split 2 columnas */}
      <div
        className="w-full max-w-[860px] min-h-[520px] overflow-hidden flex animate-fade-in-up"
        style={{
          borderRadius: 16,
          boxShadow: '0 0 0 1px rgba(0,212,255,0.08), 0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* ── Panel izquierdo — branding ────────────────── */}
        <div
          className="hidden md:flex w-[42%] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(155deg, #060d1f 0%, #0b1530 60%, #040a18 100%)',
            borderRight: '1px solid rgba(0,212,255,0.08)',
          }}
        >
          {/* Subtle cyan glow blob */}
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
              transform: 'translate(30%, -30%)',
            }}
          />

          {/* Logo */}
          <div>
            <div className="mb-8">
              <LogoG size={56} />
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 12 }}>
              Gestión PAS
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6 }}>
              Administración de asegurados, pólizas y siniestros para productores.
            </p>
          </div>

          {/* Features list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Gestión de cartera unificada',
              'Control de siniestros y reclamos',
              'Reportes en tiempo real',
            ].map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', flexShrink: 0, boxShadow: '0 0 8px rgba(0,212,255,0.6)' }} />
                <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>{feat}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div>
            <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>© 2026 Gestión PAS</p>
          </div>
        </div>

        {/* ── Panel derecho — formulario ─────────────────── */}
        <div
          className="flex-1 flex flex-col justify-center px-10 py-12"
          style={{ background: 'var(--surface-panel)' }}
        >
          {/* Mobile logo (solo en < md) */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <LogoG size={40} />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Gestión PAS</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
            Iniciar sesión
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            Ingresá con tu cuenta de productor
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="usuario@gestionpas.com.ar"
                className="input-base w-full px-4 py-3 text-sm outline-none transition-all border"
                style={{
                  borderRadius: 10,
                  borderColor: errors.identificadorAcceso ? 'rgba(224,80,80,0.5)' : 'var(--input-border)',
                }}
                {...register('identificadorAcceso')}
              />
              {errors.identificadorAcceso && (
                <p style={{ fontSize: 12, color: 'var(--policy-cancelled-text)' }}>{errors.identificadorAcceso.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-base w-full px-4 py-3 text-sm pr-11 outline-none transition-all border"
                  style={{
                    borderRadius: 10,
                    borderColor: errors.password ? 'rgba(224,80,80,0.5)' : 'var(--input-border)',
                  }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-faint)' }}
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
                <p style={{ fontSize: 12, color: 'var(--policy-cancelled-text)' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Error de servidor */}
            {serverError && (
              <div
                className="flex items-center gap-3 px-4 py-3 text-sm"
                style={{
                  borderRadius: 8,
                  background: 'var(--policy-cancelled-bg)',
                  border: '1px solid var(--policy-cancelled-border)',
                  color: 'var(--policy-cancelled-text)',
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {serverError}
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyan w-full py-3 font-bold text-sm active:scale-[0.98] inline-flex items-center justify-center"
              style={{ borderRadius: 10 }}
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
                style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
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
