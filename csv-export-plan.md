# CSV Export — Plan

## Top-Level Overview

Add a **centralized CSV export** section to Gestión PAS accessible only to the `organizador` role.
A new sidebar item **"Exportar"** routes to a dedicated page where the user can download any entity
as a `.csv` file with **all fields needed for a future import** (i.e., every scalar column plus the
natural keys of foreign relations — not UUIDs of joined rows, but the identifying string like
`dniCuil`, `numeroPoliza`, `nombre`, etc.).

Each entity export is backed by a new backend endpoint under `/export/<entidad>.csv` that queries
the database and streams a `text/csv` response with `Content-Disposition: attachment`.

**Scope:** Export only (no import). Entities: Asegurados, Bienes, Pólizas, Endosos, Cuotas,
Siniestros, Reclamos, Productores, Compañías.  
**Access:** Organizador only.  
**No changes** to existing list pages or routes.

---

## CSV Column Specification (one file per entity)

> FK references use the natural key of the related entity so data can be re-linked on import.

### `asegurados.csv`
| Column | Source |
|---|---|
| `id` | `asegurado.id` |
| `nombre` | `asegurado.nombre` |
| `dni_cuil` | `asegurado.dniCuil` |
| `fecha_nacimiento` | `asegurado.fechaNacimiento` (ISO `YYYY-MM-DD`) |
| `direccion` | `asegurado.direccion` |
| `codigo_postal` | `asegurado.codigoPostal` |
| `telefono` | `asegurado.telefono` |
| `email` | `asegurado.email` |
| `productor_dni_cuil` | `asegurado.productor.dniCuil` (natural FK) |

### `productores.csv`
| Column | Source |
|---|---|
| `id` | `productor.id` |
| `nombre` | `productor.nombre` |
| `dni_cuil` | `productor.dniCuil` |
| `telefono` | `productor.telefono` |
| `email` | `productor.email` |
| `fecha_incorporacion` | `productor.fechaIncorporacion` (ISO) |
| `companias_opera` | `productor.companiasOpera` |
| `estado` | `productor.estado` |

### `companias.csv`
| Column | Source |
|---|---|
| `id` | `compania.id` |
| `nombre` | `compania.nombre` |
| `periodo_gracia_dias` | `compania.periodoDGraciaDias` |
| `periodicidad_refacturacion` | `compania.periodicidadRefacturacion` |
| `mecanismo_notificacion` | `compania.mecanismoNotificacion` |

### `bienes.csv`
| Column | Source |
|---|---|
| `id` | `bien.id` |
| `tipo` | `bien.tipo` |
| `suma_asegurada` | `bien.sumaAsegurada` |
| `patente` | `bien.patente` |
| `marca` | `bien.marca` |
| `modelo` | `bien.modelo` |
| `version` | `bien.version` |
| `anio_fabricacion` | `bien.anioFabricacion` |
| `uso` | `bien.uso` |
| `tiene_gnc` | `bien.tieneGnc` |
| `accesorios_declarados` | `bien.accesoriosDeclarados` |
| `asegurado_dni_cuil` | `bien.asegurado.dniCuil` (natural FK) |

### `polizas.csv`
| Column | Source |
|---|---|
| `id` | `poliza.id` |
| `numero_poliza` | `poliza.numeroPoliza` |
| `vigencia_inicio` | `poliza.vigenciaInicio` (ISO) |
| `vigencia_fin` | `poliza.vigenciaFin` (ISO) |
| `importe_cuota_vigente` | `poliza.importeCuotaVigente` |
| `modalidad_pago` | `poliza.modalidadPago` |
| `estado` | `poliza.estado` |
| `periodicidad_refacturacion` | `poliza.periodicidadRefacturacion` |
| `asegurado_dni_cuil` | `poliza.asegurado.dniCuil` (natural FK) |
| `bien_patente` | `poliza.bien.patente` (natural FK — may be null for non-auto) |
| `bien_id` | `poliza.bien.id` (fallback FK for non-auto bienes) |
| `productor_dni_cuil` | `poliza.productor.dniCuil` (natural FK) |
| `compania_nombre` | `poliza.compania.nombre` (natural FK) |

### `endosos.csv`
| Column | Source |
|---|---|
| `id` | `endoso.id` |
| `numero_endoso` | `endoso.numeroEndoso` |
| `tipo_modificacion` | `endoso.tipoModificacion` |
| `fecha_emision` | `endoso.fechaEmision` (ISO) |
| `importe_actualizado` | `endoso.importeActualizado` |
| `suma_asegurada_actualizada` | `endoso.sumaAseguradaActualizada` |
| `poliza_numero` | `endoso.poliza.numeroPoliza` (natural FK) |

### `cuotas.csv`
| Column | Source |
|---|---|
| `id` | `cuota.id` |
| `numero_cuota` | `cuota.numeroCuota` |
| `importe` | `cuota.importe` |
| `fecha_vencimiento` | `cuota.fechaVencimiento` (ISO) |
| `estado` | `cuota.estado` |
| `fecha_pago_efectivo` | `cuota.fechaPagoEfectivo` (ISO) |
| `medio_pago` | `cuota.medioPago` |
| `poliza_numero` | `cuota.poliza.numeroPoliza` (natural FK) |

### `siniestros.csv`
| Column | Source |
|---|---|
| `id` | `siniestro.id` |
| `tipo` | `siniestro.tipo` |
| `fecha_ocurrencia` | `siniestro.fechaOcurrencia` (ISO) |
| `hora_ocurrencia` | `siniestro.horaOcurrencia` |
| `lugar_ocurrencia` | `siniestro.lugarOcurrencia` |
| `relato` | `siniestro.relato` |
| `datos_terceros` | `siniestro.datosTerceros` |
| `estado` | `siniestro.estado` |
| `numero_denuncia_compania` | `siniestro.numeroDenunciaCompania` |
| `asegurado_dni_cuil` | `siniestro.asegurado.dniCuil` (natural FK) |
| `bien_patente` | `siniestro.bien.patente` (natural FK) |
| `bien_id` | `siniestro.bien.id` (fallback FK) |
| `productor_dni_cuil` | `siniestro.productor.dniCuil` (natural FK) |
| `compania_nombre` | `siniestro.compania.nombre` (natural FK) |

### `reclamos.csv`
| Column | Source |
|---|---|
| `id` | `reclamo.id` |
| `tipo` | `reclamo.tipo` |
| `descripcion` | `reclamo.descripcion` |
| `estado` | `reclamo.estado` |
| `fecha_apertura` | `reclamo.fechaApertura` (ISO) |
| `asegurado_dni_cuil` | `reclamo.asegurado.dniCuil` (natural FK) |
| `productor_dni_cuil` | `reclamo.productor.dniCuil` (natural FK) |
| `compania_nombre` | `reclamo.compania.nombre` (natural FK, nullable) |

---

## Sub-Tasks

---

### Sub-Task 1 — Backend: `ExportModule`

**Status:** `[x] done`

**Intent**  
Create a dedicated NestJS module `apps/api/src/export/` with one `GET /export/<entidad>.csv`
endpoint per entity. Each endpoint serializes entity rows to RFC 4180 CSV (all fields per the
column spec above) and responds with `Content-Type: text/csv; charset=utf-8` and
`Content-Disposition: attachment; filename="<entidad>.csv"`.

**Expected Outcomes**
- `GET /export/asegurados.csv` → valid CSV with every column listed in the spec.
- Same for all 9 entities: `productores`, `companias`, `bienes`, `polizas`, `endosos`,
  `cuotas`, `siniestros`, `reclamos`.
- All endpoints JWT-protected, `@Roles(UserRole.ORGANIZADOR)`.
- Numbers use `.` decimal; dates are `YYYY-MM-DD` ISO; booleans as `true`/`false`; nulls as `""`.
- Fields containing commas, double-quotes or newlines are RFC 4180-quoted.
- No new npm dependency needed — CSV assembly is a trivial string operation.

**Todo List**
1. Create directory `apps/api/src/export/`.
2. Create `export.service.ts`:
   - Inject TypeORM repositories for all 9 entities (plus `Productor`, `CompaniaAseguradora`,
     `BienAsegurado` where needed for eager-loading relations).
   - Implement a private helper `toCsv(headers: string[], rows: string[][]): string` that
     assembles an RFC 4180 CSV string.
   - Implement one `export<Entity>()` method per entity:
     - Query with `find({ relations: [...] })` to load the FK relations needed for natural keys.
     - Map each row to a `string[]` following the column spec above.
     - Return `toCsv(headers, rows)`.
3. Create `export.controller.ts`:
   - `@Controller('export')`, `@Roles(UserRole.ORGANIZADOR)`, `@ApiBearerAuth()`.
   - One `@Get('<entidad>.csv')` per entity.
   - Each action calls `@Res() res: Response`, sets headers, writes the string, and calls
     `res.end()`. Use NestJS `@Res({ passthrough: false })` pattern to avoid double-send.
4. Create `export.module.ts`:
   - `TypeOrmModule.forFeature([Asegurado, Productor, CompaniaAseguradora, BienAsegurado,
     Poliza, Endoso, Cuota, Siniestro, Reclamo])`.
5. Register `ExportModule` in `apps/api/src/app.module.ts`.

**Relevant Context**
- Pattern to replicate: `apps/api/src/reportes/` (controller + service + module).
- Global guards apply automatically; only `@Roles(...)` is needed on the controller.
- All entities imported from `apps/api/src/database/entities` (see `app.module.ts` lines 22-34).
- `UserRole` from `@gestion-pas/types`.
- FK cartera scope is NOT needed here because only the `organizador` can call these endpoints and
  the organizador has visibility over all data.

---

### Sub-Task 2 — Frontend: `ExportarPage` and sidebar entry

**Status:** `[x] done`

**Intent**  
Add a new React page `apps/web/src/pages/ExportarPage.tsx` listing all 9 entity exports as
downloadable rows. Add a download icon to the icon library, register the `/exportar` route, and
add the nav item for `ORGANIZADOR` only.

**Expected Outcomes**
- `/exportar` route exists and renders `ExportarPage`.
- Sidebar shows an "Exportar" entry **only** for `UserRole.ORGANIZADOR`.
- Each row has: entity name, short description, "Descargar CSV" button.
- Clicking the button triggers a file download using the JWT-authenticated `api` axios instance
  (`responseType: 'blob'` → `URL.createObjectURL` → programmatic `<a>` click).
- The download filename matches the endpoint filename (e.g. `asegurados.csv`).
- Page matches existing visual style (dark theme, `page-canvas` wrapper, same spacing tokens).

**Todo List**
1. Add a download/export SVG icon `NavIcon.exportar` to
   `apps/web/src/components/ui/icons.tsx` following the same inline-SVG pattern used by all other
   nav icons.
2. Create `apps/web/src/pages/ExportarPage.tsx`:
   - Define a static array of export descriptors:
     `{ key, label, description, filename }` for each of the 9 entities.
   - Render as a list of cards/rows.
   - Each "Descargar CSV" button calls a shared `downloadCsv(filename)` helper that:
     - Calls `api.get('/export/' + filename, { responseType: 'blob' })`.
     - Creates an object URL, triggers download with the correct filename, then revokes the URL.
   - Show a per-button loading state while the request is in flight.
3. Register the route in `apps/web/src/App.tsx` inside the existing `ProtectedRoute` wrapper:
   `<Route path="/exportar" element={<ExportarPage />} />`.
4. Add the nav item to `AppLayout.tsx` in `navItemsByRole`:
   - Append `{ to: '/exportar', label: 'Exportar', IconComponent: NavIcon.exportar }` inside the
     `UserRole.ORGANIZADOR` branch only (after the existing "Reportes" entry).

**Relevant Context**
- Nav structure: `apps/web/src/components/AppLayout.tsx`, `navItemsByRole` function (lines 18-45).
- Icon pattern: `apps/web/src/components/ui/icons.tsx` — inline SVG wrapped in a size-prop component.
- Axios instance with JWT interceptor: `apps/web/src/lib/api.ts`.
- Route definitions: `apps/web/src/App.tsx`.
- Visual reference: any existing page (e.g., `ReportesPage.tsx`) for the layout structure.
