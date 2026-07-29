# Plan de desarrollo — Sistema de Gestión Gestión PAS

> Cada etapa se ejecuta en su propia sesión de trabajo (chat independiente).  
> Al iniciar cada sesión: leer `docs/CONTEXT.md` + los archivos de código relevantes a esa etapa.

---

## Etapa 0 — Setup del proyecto ✅ COMPLETADO

**Objetivo:** Monorepo funcionando, entorno de desarrollo.

**Tareas:**
- [x] Monorepo con pnpm workspaces (`pnpm-workspace.yaml`)
- [x] `apps/api` — NestJS + TypeScript, configuración de módulos base
- [x] `apps/web` — React + TypeScript (Vite)
- [x] `packages/types` — enums y tipos compartidos (DTOs, enums de estados)
- [x] `docker-compose.yml` (adaptado a Podman — usar `podman-compose up -d`)
- [x] Variables de entorno (`apps/api/.env.example`)
- [x] ESLint + Prettier en todo el monorepo

**Notas de implementación:**
- Podman en lugar de Docker (empresa no permite Docker Desktop)
- pnpm instalado en `~/.npm-global/bin`
- `bcrypt` nativo no compila → se usa `bcryptjs`

---

## Etapa 1 — Base de datos y modelo de datos ✅ COMPLETADO

**Objetivo:** Schema completo de PostgreSQL, migraciones, seed básico.

**Tareas:**
- [x] 12 entities TypeORM (Organizador, Productor, Asegurado, BienAsegurado, CompaniaAseguradora, Poliza, Endoso, Cuota, Siniestro, Reclamo, Documento, Usuario)
- [x] Migración inicial (`1000000000000-InitialSchema.ts`) con 14 enum types + 12 tablas + 9 índices
- [x] Constraints UNIQUE en `asegurados.dni_cuil` y `productores.dni_cuil`
- [x] FK con integridad referencial en todas las relaciones
- [x] Seed rico: 4 productores, 9 asegurados, 4 compañías, 12 bienes, 10 pólizas, 8 endosos, 30 cuotas, 6 siniestros, 7 reclamos

**Notas de implementación:**
- `SnakeCaseNamingStrategy` en `apps/api/src/database/naming-strategy.ts` — importada por `app.module.ts` y `data-source.ts`
- Scripts de migración en `src/database/scripts/` (no inline en package.json)
- `rootDir: "../.."` en `tsconfig.json` para resolver `@gestion-pas/types` fuera de `src/`

**Artefactos:**
- `apps/api/src/database/entities/` — 12 entities
- `apps/api/src/database/naming-strategy.ts` — estrategia snake_case compartida
- `apps/api/src/database/migrations/1000000000000-InitialSchema.ts`
- `apps/api/src/database/seeds/seed.ts` — seed rico
- `apps/api/src/database/seeds/seed-admin.ts` — usuario organizador

---

## Etapa 2 — Backend: Auth + Usuarios ✅ COMPLETADO

**Objetivo:** API de autenticación con RBAC funcionando.

**Módulo:** M1 — Usuarios y Autenticación

**Tareas:**
- [x] `POST /api/auth/login` — JWT access token
- [x] `POST /api/auth/users` — organizador crea usuarios (productor/asegurado)
- [x] `PATCH /api/auth/users/:id/status` — activar/desactivar usuario
- [x] `JwtAuthGuard` + `RolesGuard` globales via `APP_GUARD` en AppModule
- [x] Decoradores `@Public()`, `@Roles(...)`, `@CurrentUser()`
- [x] Contraseñas hasheadas con bcryptjs

**Notas de implementación:**
- Guards globales en `AppModule` — todo endpoint es privado salvo `@Public()`
- `dev` script usa `ts-node` directo (no `nest start --watch`)
- `login()` hace una única query con `relations: ['asegurado', 'organizador']`
- `updateStatus` recarga desde DB con `findOneOrFail` tras el UPDATE
- Usuarios de prueba: `florencia@gestionpas.com.ar` / `admin1234` (organizador), `leandro@gestionpas.com.ar` / `prod1234` (productor)

**Artefactos:**
- `apps/api/src/auth/` — módulo completo (auth.module, service, controller, guards, strategies, decorators, DTOs)

---

## Etapa 3 — Backend: Entidades core (M2, M3, M8, M9) ✅ COMPLETADO

**Objetivo:** CRUD de las entidades maestras con RBAC aplicado.

**Módulos:** Asegurados · Bienes Asegurados · Productores · Compañías Aseguradoras

**Tareas:**
- [x] `GET /api/asegurados` — listado filtrado por cartera según perfil (filtro en query TypeORM, no en memoria); búsqueda por `?search=`
- [x] `POST /api/asegurados` — con validación de unicidad DNI (409 Conflict si duplicado)
- [x] `GET/PATCH /api/asegurados/:id`
- [x] `GET /api/bienes/asegurado/:aseguradoId` — bienes de un asegurado
- [x] `GET/POST/PATCH /api/bienes/:id` — con estructura diferenciada por tipo (automotor exige patente)
- [x] `GET/POST/PATCH /api/productores` — solo organizador puede crear/listar todos; productor ve solo su ficha (403 si intenta ver otra)
- [x] `GET/POST/PATCH /api/companias` — solo organizador puede crear/modificar
- [x] RBAC aplicado a cada endpoint según matriz de `ARCHITECTURE.md`

**Artefactos:**
- `apps/api/src/asegurados/` — AseguradosModule
- `apps/api/src/bienes/` — BienesModule
- `apps/api/src/productores/` — ProductoresModule
- `apps/api/src/companias/` — CompaniasModule

---

## Etapa 4 — Backend: Pólizas, Endosos, Cuotas (M4, M5) ✅ COMPLETADO

**Objetivo:** El núcleo transaccional del negocio.

**Tareas:**
- [x] `GET/POST /api/polizas` vinculadas a asegurado + bien + productor + compañía
- [x] `PATCH /api/polizas/:id` — actualizar estado / importe vigente
- [x] `POST /api/polizas/:id/endosos` — registrar endoso
- [x] `GET /api/polizas/:id/endosos` — historial de endosos
- [x] `GET/POST /api/cuotas` por póliza
- [x] `PATCH /api/cuotas/:id` — actualizar estado (pagada, rechazada, etc.)
- [x] `GET /api/cuotas/vencimientos-proximos?dias=N` — query con filtro de días (strings ISO)
- [x] Auto-suspensión de pólizas vencidas en cada lectura (sin cron)

**Artefactos:**
- `apps/api/src/polizas/` — PolizasModule (controller, service, dto)
- `apps/api/src/cuotas/` — CuotasModule (controller, service, dto)

---

## Etapa 5 — Backend: Siniestros, Reclamos, Documentos (M6, M7, M10) ✅ COMPLETADO

**Objetivo:** Trazabilidad de trámites.

**Tareas:**
- [x] `GET/POST /api/siniestros` con campos estructurados
- [x] `PATCH /api/siniestros/:id/estado`
- [x] `GET/POST /api/reclamos`
- [x] `PATCH /api/reclamos/:id/estado`
- [x] `POST /api/documentos` — guarda referencia de URL en DB (upload real al object storage queda para producción)
- [x] `GET /api/documentos?entidad=siniestro&entidadId=:id` — con validación UUID de `entidadId`

**Artefactos:**
- `apps/api/src/siniestros/` — SiniestrosModule (controller, service, dto)
- `apps/api/src/reclamos/` — ReclamosModule (controller, service, dto)
- `apps/api/src/documentos/` — DocumentosModule (controller, service, dto)

---

## Etapa 6 — Backend: Reportes (M11) ✅ COMPLETADO

**Objetivo:** Queries agregadas para el dashboard del organizador.

**Tareas:**
- [x] `GET /api/reportes/cartera-asegurados`
- [x] `GET /api/reportes/vencimientos-proximos?dias=N` — strings ISO, solo cuotas PENDIENTE
- [x] `GET /api/reportes/siniestros?estado=abierto`
- [x] `GET /api/reportes/reclamos` con filtros estado/tipo/compañía
- [x] `GET /api/reportes/polizas` por estado/vencimiento — auto-suspend antes de leer
- [x] `GET /api/reportes/comisiones` por productor
- [x] `GET /api/reportes/datos-incompletos` (bienes con campos vacíos)

**Artefactos:**
- `apps/api/src/reportes/` — ReportesModule (controller, service; sin DTOs ni entidades propias)

---

## Etapa 7 — Frontend: Auth + Layout base ✅ COMPLETADO

**Objetivo:** Aplicacion web con login, routing por perfil y layout.

**Tareas:**
- [x] Login page + logica de JWT (almacenar token, interceptor axios)
- [x] Router protegido por perfil (organizador / productor / asegurado)
- [x] `/productores` y `/companias` protegidas con `allowedRoles={[ORGANIZADOR]}`
- [x] `/reportes` protegida con `allowedRoles={[ORGANIZADOR, PRODUCTOR]}`
- [x] Layout base: sidebar con modulos segun perfil
- [x] Pantalla de inicio / dashboard segun rol

**Artefactos:**
- `apps/web/src/lib/api.ts` — axios instance con interceptores JWT/401
- `apps/web/src/lib/auth.ts` — helpers localStorage (save/load/clear)
- `apps/web/src/lib/useDarkMode.ts` — hook dark mode con localStorage + prefers-color-scheme
- `apps/web/src/context/AuthContext.tsx` — AuthProvider + useAuth hook
- `apps/web/src/components/ProtectedRoute.tsx` — guard con allowedRoles
- `apps/web/src/components/AppLayout.tsx` — sidebar por rol + dark mode toggle
- `apps/web/src/pages/LoginPage.tsx`
- `apps/web/src/pages/DashboardPage.tsx`

---

## Etapa 8 — Frontend: Módulos de asegurados, bienes, pólizas ✅ COMPLETADO

**Objetivo:** Flujo principal del negocio en UI.

**Tareas:**
- [x] Listado + busqueda de asegurados
- [x] Formulario de alta de asegurado con validacion de DNI unico
- [x] Alta de bien asegurado con formulario condicional (automotor vs hogar vs otro)
- [x] Alta de poliza vinculada a asegurado + bien + compania
- [x] Vista de poliza con historial de endosos y cuotas

**Artefactos:**
- `apps/web/src/lib/format.ts` — helpers formatDate / formatMoney
- `apps/web/src/lib/cn.ts` — cn(), cls object, badge helpers por enum
- `apps/web/src/pages/AseguradosPage.tsx`
- `apps/web/src/pages/BienesPage.tsx`
- `apps/web/src/pages/PolizasPage.tsx`

---

## Etapa 9 — Frontend: Siniestros con interfaz visual de daños ✅ COMPLETADO

**Objetivo:** El modulo de mayor complejidad visual.

**Tareas:**
- [x] Formulario de alta de siniestro con campos estructurados
- [x] Componente de silueta de vehiculo interactivo (marcar zona de dano con SVG)
- [x] Vista de seguimiento de estado para asegurado (la "caja negra" resuelta)

**Artefactos:**
- `apps/web/src/components/VehiculoSilueta.tsx` — SVG interactivo con 14 zonas
- `apps/web/src/pages/SiniestrosPage.tsx` — listado, alta, detalle con stepper

---

## Etapa 10 — Frontend: Reclamos, Documentos, Reportes ✅ COMPLETADO

**Objetivo:** Completar la UI de los modulos restantes.

**Tareas:**
- [x] Formulario de reclamo + vista de estado
- [x] Gestor de documentos por entidad (listado vinculado + alta por URL)
- [x] Dashboard de reportes para organizador (7 reportes)
- [x] Vistas de cartera filtradas para el productor
- [x] Páginas Productores y Compañías completas con CRUD

**Artefactos:**
- `apps/web/src/pages/ReclamosPage.tsx`
- `apps/web/src/pages/DocumentosPage.tsx`
- `apps/web/src/pages/ReportesPage.tsx` — 7 reportes con Recharts (BarChart + PieChart)
- `apps/web/src/pages/ProductoresPage.tsx`
- `apps/web/src/pages/CompaniasPage.tsx`

---

## Code Review — Pasada 1 ✅ COMPLETADO

11 hallazgos corregidos. Ver sección correspondiente en `CONTEXT.md`.

---

## Code Review — Pasada 2 ✅ COMPLETADO

7 hallazgos corregidos. Ver sección correspondiente en `CONTEXT.md`.

---

## Etapa 11 — Testing, hardening y deploy ⬜ PENDIENTE

**Objetivo:** Sistema listo para producción.

**Tareas:**
- [ ] Tests unitarios en servicios críticos (auth, unicidad DNI, RBAC)
- [ ] Tests de integración en endpoints principales
- [ ] Configuración de entorno de producción (variables, HTTPS, CORS)
- [ ] Backup automático de PostgreSQL en nube
- [ ] Documentación de API (Swagger — ya configurado en `main.ts`, revisar cobertura)
- [ ] Manual de usuario (basado en la propuesta técnica)
