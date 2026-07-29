# CONTEXT.md — Memoria del proyecto Gestión PAS

> Este archivo es el punto de entrada de cada nueva sesión de trabajo.  
> Leerlo al inicio de cada chat. Actualizarlo al cierre.

---

## Sistema

Aplicación web de gestión administrativa para **Gestión PAS**, broker organizador de seguros (~70 productores, Caseros/CABA).  
Reemplaza WhatsApp + Excel personal + portales de aseguradoras como fuentes de verdad.  
**No integra** con sistemas externos (v1). Registro paralelo alimentado manualmente.

## Stack

| Componente | Tecnología |
|---|---|
| Base de datos | PostgreSQL 16 |
| Backend | Node.js + NestJS + TypeScript |
| Frontend | React + TypeScript + Vite |
| Package manager | pnpm 11 (monorepo con workspaces) |
| Contenedores local | Podman (`podman-machine-default`, puerto 52919) |
| Despliegue | Nube (cloud provider a definir en propuesta comercial) |

## Perfiles de usuario

- **Organizador** (4 socios) — visibilidad total de la red
- **Productor** (~70 PAS) — solo su cartera
- **Asegurado** (clientes) — solo su información (puede habilitarse en v2 gradualmente)

## Módulos (11)

1. Usuarios y Autenticación
2. Asegurados (padrón unificado, DNI=clave única)
3. Bienes Asegurados (formulario por tipo: automotor/hogar/vida/otro)
4. Pólizas y Endosos (endoso como entidad propia con historial)
5. Cuotas y Pagos (monitoreo, no cobranza)
6. Siniestros (captura estructurada + silueta visual de daños)
7. Reclamos (existencia formal desde origen)
8. Productores (ficha institucional + comisiones)
9. Compañías Aseguradoras (reglas de negocio: gracia, refacturación, notif)
10. Documentación (siempre vinculada a entidad + trámite)
11. Reportes (7 reportes definidos, sin entidad propia)

## Estado del proyecto

| Etapa | Estado |
|---|---|
| Etapa 0 — Setup del monorepo | ✅ Completado |
| Etapa 1 — DB / Migraciones | ✅ Completado |
| Etapa 2 — Auth + RBAC | ✅ Completado |
| Etapa 3 — Entidades core (M2,M3,M8,M9) | ✅ Completado |
| Etapa 4 — Pólizas, Endosos, Cuotas (M4,M5) | ✅ Completado |
| Etapa 5 — Siniestros, Reclamos, Docs (M6,M7,M10) | ✅ Completado |
| Etapa 6 — Reportes (M11) | ✅ Completado |
| Etapa 7 — Frontend: Auth + Layout | ✅ Completado |
| Etapa 8 — Frontend: Asegurados, Bienes, Pólizas | ✅ Completado |
| Etapa 9 — Frontend: Siniestros (silueta visual) | ✅ Completado |
| Etapa 10 — Frontend: Reclamos, Docs, Reportes | ✅ Completado |
| Tailwind v4 Migration (UI completa) | ✅ Completado |
| Code Review — Pasada 1 (11 hallazgos) | ✅ Completado |
| Code Review — Pasada 2 (7 hallazgos) | ✅ Completado |
| Etapa 11 — Testing + Deploy | ✅ Completado |

## Decisiones técnicas importantes

- `Asegurado.dni_cuil` y `Productor.dni_cuil` tienen constraint UNIQUE
- Endoso es tabla propia (no campo de póliza) — soporta hasta 12 endosos/año por refacturación
- Documento tiene referencia polimórfica a cualquier entidad del negocio
- Archivo binario de documentos → object storage (S3/GCS); DB guarda solo la URL/referencia
- Sin integración con sistemas externos en v1
- Perfil asegurado puede habilitarse gradualmente en v2

## Convenciones de código

- TypeScript estricto en todo el proyecto
- NestJS: módulo por dominio (un módulo por cada M1-M11)
- Nombres en español para entidades de negocio, inglés para estructuras técnicas
- Estados como enum TypeScript + PostgreSQL enum type
- Todos los endpoints pasan por guard `@Roles(...)`

## Archivos clave del proyecto

- `docs/PRD.md` — Requisitos completos con fichas de campos
- `docs/ARCHITECTURE.md` — Stack, capas, diagrama ER, matriz de acceso
- `docs/PLAN.md` — Etapas detalladas con tareas
- `docs/CONTEXT.md` — Este archivo (memoria del proyecto)

## Decisiones técnicas adicionales (Etapa 1)

- `SnakeCaseNamingStrategy` extraída a `apps/api/src/database/naming-strategy.ts` — importada por `app.module.ts` y `data-source.ts` (eliminada la duplicación)
- Scripts de migración en `apps/api/src/database/scripts/` (no inline en package.json, para evitar conflictos con `strict`)
- `dotenv` agregado como dependencia de producción (usado por `data-source.ts` al correr migraciones fuera de NestJS)
- `bcrypt` nativo no compila en este entorno → se usa **`bcryptjs`** (puro JS, misma API)
- `dev` script usa `ts-node` directo (no `nest start --watch`) para evitar conflicto con el build de dist
- Guards globales: `JwtAuthGuard` + `RolesGuard` aplicados en `AppModule` vía `APP_GUARD`. Todo endpoint es privado salvo `@Public()`
- Usuario admin: `florencia@gestionpas.com.ar` / `admin1234` (organizador)
- Usuario productor de prueba: `leandro@gestionpas.com.ar` / `prod1234`

## Notas de entorno

- Docker **no disponible** en la máquina de desarrollo. Usar **Podman**.
- `podman-machine-default` es la VM activa (puerto SSH 52919). Antes de levantar contenedores: `podman machine start podman-machine-default && podman system connection default podman-machine-default`
- `podman-compose` instalado vía pip3. Usar `podman-compose up -d` en lugar de `docker compose up -d`.
- pnpm está en `~/.npm-global/bin` — requiere `export PATH="$HOME/.npm-global/bin:$PATH"` o tenerlo en `~/.zshrc`.
- El backend corre con `ts-node` (no compila a `dist`). No recarga automáticamente — requiere reinicio manual tras cambios.

## Comparación de fechas con columnas `date` de PostgreSQL

Todas las columnas de tipo `date` en PG (sin componente horario) deben compararse con **strings ISO `YYYY-MM-DD`**, nunca con objetos `Date` de JavaScript. Los objetos `Date` se serializan como timestamps y pueden dar resultados incorrectos según la timezone del servidor.

Patrón correcto aplicado en todo el proyecto:
```ts
const hoy = new Date().toISOString().slice(0, 10); // '2026-07-28'
await repo.update({ vigenciaFin: LessThan(hoy) as unknown as Date }, ...);
```

Afecta a: `PolizasService.suspenderVencidas()`, `ReportesService.suspenderPolizasVencidas()`, `ReportesService.vencimientosProximos()` (R2), `ReportesService.polizas()` (R5).

## Etapa 4 — Pólizas, Endosos, Cuotas (notas de implementación)

- `PolizasModule`: `GET/POST /api/polizas`, `PATCH /api/polizas/:id`, `POST/GET /api/polizas/:id/endosos`
- `CuotasModule`: `GET/POST /api/cuotas?polizaId=`, `GET /api/cuotas/:id`, `PATCH /api/cuotas/:id`, `GET /api/cuotas/vencimientos-proximos?dias=N`
- RBAC: organizador y productor pueden crear/modificar; el productor solo ve su cartera (filtro en query, no en memoria)
- Ruta `vencimientos-proximos` declarada **antes** de `:id` en el controller para que NestJS no la consuma como UUID
- Filtros de fecha usan strings ISO (ver sección anterior)

## Etapa 5 — Siniestros, Reclamos, Documentos (notas de implementación)

- `SiniestrosModule`: `GET/POST /api/siniestros`, `PATCH /api/siniestros/:id/estado`
- `ReclamosModule`: `GET/POST /api/reclamos`, `PATCH /api/reclamos/:id/estado`
- `DocumentosModule`: `POST /api/documentos`, `GET /api/documentos?entidad=&entidadId=`
- Documentos usan FK polimórfica — solo un campo FK está poblado por fila; `entidadToField()` mapea el enum al nombre del campo de relación
- `loadEntidad()` en DocumentosService usa un `Record<EntidadDocumento, Repository>` para resolver el repo por enum sin switch
- RBAC: organizador y productor crean/modifican; asegurado solo lee su propia información
- `entidadId` en `GET /api/documentos` validado con regex UUID antes de pasar al service (400 si inválido)

## Etapa 6 — Reportes (notas de implementación)

- `ReportesModule`: 7 endpoints GET bajo `/api/reportes/`, sin entidades propias
- `@Roles(ORGANIZADOR, PRODUCTOR)` a nivel de controller — asegurado no accede a reportes
- Todos los reportes respetan el filtro de cartera para el productor (`productor.id === usuario.productor.id`)
- R6 (comisiones): no hay tabla de comisiones en v1 — el reporte agrega `importeCuotaVigente` de pólizas activas por productor como proxy
- R7 (datos incompletos): evalúa campos clave por tipo de bien (`patente/marca/modelo/anio` para automotor, `sumaAsegurada` para todos)

## Etapa 7 — Frontend Auth + Layout (notas de implementacion)

- `AuthContext` carga el estado desde `localStorage` al iniciar (token + perfil) — sesion persistente entre recargas
- Interceptor axios en `src/lib/api.ts`: adjunta JWT y redirige a `/login` en 401
- `ProtectedRoute` wrappea `<Outlet>` — acepta `allowedRoles` opcional para restriccion por perfil
- `/productores` y `/companias` protegidas con `allowedRoles={[ORGANIZADOR]}`
- `/reportes` protegida con `allowedRoles={[ORGANIZADOR, PRODUCTOR]}`
- `AppLayout` sidebar oscuro con `NavLink` activo resaltado — items filtrados por rol
- `DashboardPage` usa `useQuery` de TanStack Query para cargar los reportes del backend

## Etapa 8 — Frontend Asegurados, Bienes, Polizas (notas de implementacion)

- `lib/format.ts` — `formatDate` y `formatMoney` reutilizables
- `AseguradosPage`: listado con busqueda debounced, modal alta con validacion 409
- `BienesPage`: acepta `?aseguradoId` via useParams; formulario condicional automotor con `useWatch`
- `PolizasPage`: unico archivo con listado, detalle, forms de endoso y cuota; routing interno con `useParams`
- Cuotas: boton "Marcar pagada" inline en tabla de detalle de poliza
- Polizas: cambio de estado (Suspender/Reactivar) con `PATCH /polizas/:id` desde el detalle

## Etapa 9 — Frontend Siniestros con silueta visual (notas de implementacion)

- `VehiculoSilueta.tsx`: SVG con viewBox 500x220, 14 zonas como `<path>` clickeables; prop `readOnly` para modo detalle
- `ZONAS` exportado como array — permite buscar labels por id en la leyenda
- Silueta se muestra solo para siniestros de tipo automotor (colision/robo_total/robo_autopartes)
- `zonasAfectadas` se envia al backend en el POST pero la entity no tiene la columna aun — se agrega en migracion futura
- `EstadoStepper`: stepper visual inline con circulos de estado, conector entre pasos, manejo especial para "rechazado"
- Detalle muestra panel de gestion (cambio de estado) solo a organizador y productor; asegurado ve solo el stepper

## Etapa 10 — Frontend Reclamos, Documentos, Reportes (notas de implementacion)

- `ReclamosPage`: patron identico a SiniestrosPage — listado, alta, detalle con stepper Abierto→En gestion→Resuelto
- `DocumentosPage`: filtro por entidad + UUID; resultado vacio hasta que se busca (no carga todo al abrir)
- `ReportesPage`: 6 stat cards de resumen + 7 secciones desplegables (R1-R7) con datos reales del backend
- Recharts v3 para graficos: BarChart (R3, R4, R6), PieChart (R5) — dark-mode aware con tooltip custom

## Tailwind v4 Migration (completada)

- Todas las páginas migradas de CSS Modules a Tailwind v4 utility classes
- `src/lib/cn.ts` — `cn()`, `cls` object con clases reutilizables, badge helpers por enum
- `VehiculoSilueta.tsx` — migrado a Tailwind (inline styles solo para fill/stroke SVG dinámicos)
- Todos los `.module.css` eliminados — `pnpm typecheck` → 0 errores

## Code Review — Pasada 1 (completada)

Correcciones aplicadas:

| # | Archivo | Cambio |
|---|---|---|
| 1 | `reportes.service.ts` | `suspenderPolizasVencidas()` usa string ISO `YYYY-MM-DD` |
| 2 | `AuthContext.tsx` | Triple `if/else` idéntico → `navigate('/dashboard')` directo |
| 3 | `asegurados.service.ts` | Filtro de cartera del productor en query TypeORM, no en memoria |
| 4 | `documentos.controller.ts` | Validación UUID con regex para `entidadId` → 400 si inválido |
| 5 | `auth.service.ts` | `updateStatus` recarga desde DB con `findOneOrFail` en lugar de spread optimista |
| A | `naming-strategy.ts` (nuevo) | `SnakeCaseNamingStrategy` extraída a archivo compartido |
| B | `packages/types/src/api.ts` | `PaginatedResponse` comentada como reservada para v2 |
| D | `DashboardPage.tsx` | Saludo hardcodeado "Florencia" → función genérica |
| 7 | `DashboardPage.tsx` | Tipos `asegurado?/compania?` alineados a `string \| null` |

## Code Review — Pasada 2 (completada)

Correcciones aplicadas:

| # | Archivo | Cambio |
|---|---|---|
| N1 | `productores.controller.ts` | `findOne` lanzaba 200 con `{message}` para cartera ajena → `ForbiddenException` (403) |
| N2 | `reportes.service.ts` R2 | `Between(Date, Date)` → `Between(hoyStr, limiteStr)` strings ISO |
| N3 | `reportes.service.ts` R5 | Idem para `vigenciaFin` en el filtro `vencenEnDias` |
| N4 | `DashboardPage.tsx` | `CARD_ICON` declarado y nunca usado, eliminado |
| N5 | `DashboardPage.tsx` | `estadoPolicaBadge` importado y nunca usado, eliminado |
| N6 | `auth.service.ts` | `login()` unificado a una sola query; `ultimaSesion` actualizado con `void` (fire-and-forget) |
| N7 | `App.tsx` | `/productores` y `/companias` envueltas en `ProtectedRoute allowedRoles={[ORGANIZADOR]}` |

## Seed rico (ejecutado)

El seed rico fue ejecutado. Para volver a correrlo:
```bash
export PATH="$HOME/.npm-global/bin:$PATH"
cd apps/api
npx ts-node -r tsconfig-paths/register src/database/seeds/seed.ts
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-admin.ts
```

| Entidad | Cantidad | Notas |
|---|---|---|
| Organizador | 1 | María Florencia Mangialavori |
| Productores | 4 | 3 activos, 1 inactivo (Patricia Moreno) |
| Asegurados | 9 | 3 con datos incompletos |
| Compañías | 4 | Federación Patronal, La Equitativa del Plata, Galicia Seguros, Sancor Seguros |
| Bienes | 12 | 4 con datos incompletos (testean R7) |
| Pólizas | 10 | 2 activas (ago 2026), resto suspendidas/anulada |
| Endosos | 8 | |
| Cuotas | 30 | variedad de estados |
| Siniestros | 6 | todos los estados representados |
| Reclamos | 7 | todos los estados representados |

**Usuarios activos:**
- `florencia@gestionpas.com.ar` / `admin1234` (organizador)
- `leandro@gestionpas.com.ar` / `prod1234` (productor — requiere `seed-admin.ts` extendido)

## Etapa 11 — Testing, hardening y deploy (completada)

### Tests unitarios (20 tests — pnpm test)

| Archivo | Casos |
|---|---|
| `auth/auth.service.spec.ts` | login happy path, credenciales inválidas, usuario inactivo, mensajes de error |
| `asegurados/asegurados.service.spec.ts` | 409 DNI duplicado, 403 cartera ajena, 404 productor inexistente, filtro de cartera productor/organizador |
| `auth/guards/roles.guard.spec.ts` | permite sin @Roles(), permite con rol correcto, 403 con rol incorrecto, 403 asegurado en ruta de organizador |

### Tests de integración (e2e — pnpm test:e2e)

| Archivo | Endpoints cubiertos |
|---|---|
| `test/auth.e2e-spec.ts` | POST /api/auth/login (200, 401, 400) |
| `test/asegurados.e2e-spec.ts` | GET /api/asegurados (200, filtro cartera), POST (400, 401) |
| `test/polizas.e2e-spec.ts` | GET /api/polizas (200, filtro cartera, 401, 403/404 cartera ajena) |
| `test/cuotas.e2e-spec.ts` | GET /api/cuotas/vencimientos-proximos (200, PENDIENTE, strings ISO, filtro cartera, 401) |

Los tests e2e **requieren la base de datos en ejecución** con el seed rico aplicado.

### Hardening de producción (`apps/api/src/main.ts`)

- `helmet()` añade cabeceras de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- `ThrottlerModule` registrado en `AppModule`: máximo 100 req/min por IP vía `APP_GUARD`
- CORS restringido a `FRONTEND_URL` (advertencia si no está definida en prod)
- Swagger deshabilitado en `NODE_ENV=production`
- `JWT_SECRET` obligatorio en producción — falla con `process.exit(1)` si no está definido

### Swagger — cobertura de @ApiResponse

`@ApiResponse` añadido a todos los endpoints de todos los controllers (400, 401, 403, 404, 409 según corresponde).

### Documentación

- `docs/MANUAL.md` — manual de usuario completo (10 módulos, 4 flujos de trabajo, FAQ)

## Próximos pasos

**Sistema listo para el primer deploy de producción.**

Pasos sugeridos para el deploy:
1. Elegir cloud provider (Railway, Render, Fly.io, o VPS propio)
2. Configurar variables de entorno de producción (`.env` con `NODE_ENV=production`, `JWT_SECRET` seguro, `FRONTEND_URL`, `DB_*`)
3. Correr migraciones: `pnpm migration:run`
4. Hacer el primer deploy del backend (`pnpm build && pnpm start`)
5. Hacer el build del frontend (`pnpm build`) y deployarlo en Vercel/Netlify
6. Correr el seed de producción con datos iniciales reales
