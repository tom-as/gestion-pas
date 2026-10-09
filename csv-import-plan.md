# CSV Import — Plan

## Top-Level Overview

Add **bulk CSV import** to Gestión PAS, symmetric with the export already implemented.
The organizador sube un archivo `.csv` a un endpoint `POST /import/<entidad>` que:
1. Parsea el archivo línea por línea.
2. Resuelve las claves naturales de FK (dniCuil → UUID, numeroPoliza → UUID, nombre compañía → UUID).
3. Inserta las filas faltantes usando la misma lógica de creación ya existente en cada servicio.
4. Devuelve un reporte `{ inserted, skipped, errors[] }` — **nunca elimina datos existentes**.

La UI agrega una sección "Importar CSV" en la página `/exportar` (que pasa a llamarse
`TransferenciaPage` o mantiene el mismo path `/exportar` renombrado a "Transferencia de datos"),
con un file-picker y feedback de resultado por entidad.

**Orden de importación obligatorio** (respetar dependencias entre entidades):
1. Compañías (sin FK)
2. Productores (sin FK de negocio, FK a organizador se resuelve del usuario autenticado)
3. Asegurados (FK → productor por dniCuil)
4. Bienes (FK → asegurado por dniCuil)
5. Pólizas (FK → asegurado, bien, productor, compañía)
6. Endosos (FK → póliza por numeroPoliza)
7. Cuotas (FK → póliza por numeroPoliza)
8. Siniestros (FK → asegurado, bien, productor, compañía)
9. Reclamos (FK → asegurado, productor, compañía)

**Acceso:** Solo `UserRole.ORGANIZADOR`.  
**Dependencias nuevas:** `multer` (ya disponible vía `@nestjs/platform-express` que ya está en `package.json`) — no requiere instalación extra. `@types/multer` se agrega como devDependency.  
**Sin cambios** a los módulos existentes — el `ImportModule` llama directamente a los repositorios.

---

## Contrato de respuesta por endpoint

```
POST /import/<entidad>
Content-Type: multipart/form-data
Body: file (campo "file", .csv)

Response 200:
{
  "inserted": number,
  "skipped": number,
  "errors": [{ "row": number, "message": string }]
}
```

- `inserted`: filas efectivamente creadas en la DB.
- `skipped`: filas que ya existían (detectadas por clave única — dniCuil, numeroPoliza, nombre compañía).
- `errors`: filas con datos inválidos o referencias FK inexistentes, con número de fila y motivo legible.

---

## Sub-Tasks

---

### Sub-Task 1 — Instalar `@types/multer` como devDependency en la API

**Status:** `[ ] pending`

**Intent**  
`multer` ya viene incluido con `@nestjs/platform-express` (ya en `dependencies`). Solo falta el
paquete de tipos para TypeScript.

**Expected Outcomes**
- `pnpm add -D @types/multer --filter @gestion-pas/api` ejecuta sin error.
- El archivo `apps/api/package.json` incluye `"@types/multer"` en `devDependencies`.
- `tsc --noEmit` sigue pasando.

**Todo List**
1. Ejecutar `pnpm add -D @types/multer --filter @gestion-pas/api` desde la raíz del workspace.

**Relevant Context**
- `apps/api/package.json` — verificar que `@nestjs/platform-express` ya está en `dependencies` (línea 27).
- La instalación no requiere cambios de código.

---

### Sub-Task 2 — Backend: `ImportService` — parser CSV y lógica de upsert por entidad

**Status:** `[ ] pending`

**Intent**  
Crear `apps/api/src/import/import.service.ts` con:
- Un helper privado `parseCsv(buffer)` que convierte el Buffer del archivo a `string[][]`
  (array de filas, cada fila es array de celdas), respetando RFC 4180 (celdas entre comillas,
  saltos de línea embebidos). La primera fila es el header.
- Un helper `importResult()` que acumula `inserted / skipped / errors`.
- Nueve métodos `import<Entidad>(buffer)` — uno por entidad — siguiendo el orden de dependencias.
  Cada método:
  1. Llama a `parseCsv`.
  2. Carga un mapa de lookup para resolver FKs naturales (e.g. `dniCuilToId` para asegurados).
  3. Itera filas. Para cada fila:
     - Si la clave única ya existe → `skipped++`.
     - Si alguna FK no se puede resolver → `errors.push({ row, message })`.
     - Si los datos son válidos → inserta con `repo.save()` → `inserted++`.
  4. Retorna `{ inserted, skipped, errors }`.

**Lógica de lookup de FKs:**
- `productor_dni_cuil` → query `productorRepo.findBy({ dniCuil })` → `.id`
- `asegurado_dni_cuil` → query `aseguradoRepo.findBy({ dniCuil })` → `.id`
- `bien_patente` / `bien_id` → primero intenta por patente, fallback por id
- `poliza_numero` → query `polizaRepo.findBy({ numeroPoliza })` → `.id`
- `compania_nombre` → query `companiaRepo.findBy({ nombre })` → `.id`

**Para productores:** el campo `organizador_id` no está en el CSV (fue diseñado así intencionalmente).
El `ImportService` recibe el `usuario: Usuario` del controller y usa `usuario.organizador.id`
para asignar el organizador al crear cada productor.
El `Usuario` ya tiene la relación `organizador` cargada (ver `usuario.entity.ts`).

**Expected Outcomes**
- Cada `import<Entidad>()` corre sin errores de compilación.
- Filas duplicadas se cuentan como `skipped` (no lanzan error).
- Filas con FK inexistente se agregan a `errors` con mensaje claro.
- Filas válidas se insertan en la DB.

**Todo List**
1. Crear `apps/api/src/import/import.service.ts`.
2. Implementar `parseCsv(buffer: Buffer): { headers: string[]; rows: string[][] }`.
   - Convertir buffer a string UTF-8 (strip BOM si existe).
   - Parsear respetando RFC 4180: celdas entre comillas pueden contener comas y saltos de línea.
3. Implementar los 9 métodos `import<Entidad>` en el orden correcto. Referencia de columnas:
   las mismas cabeceras que genera `ExportService` en `export.service.ts`.
4. Para cada entidad, usar `repo.findOne({ where: { <clave_unica>: valor } })` para detectar
   duplicados antes de insertar.
5. **No usar `@Inject` de otros Services** — inyectar los repos directamente para evitar
   dependencias circulares entre módulos.

**Relevant Context**
- Columnas exactas por entidad: ver sección "CSV Column Specification" en `csv-export-plan.md`.
- Lógica de creación existente: `asegurados.service.ts`, `polizas.service.ts`, `bienes.service.ts`,
  `siniestros.service.ts`, `reclamos.service.ts`, `cuotas.service.ts`, `productores.service.ts`,
  `companias.service.ts` — los métodos `create()` muestran exactamente qué campos copiar y qué
  relaciones resolver.
- `usuario.entity.ts`: leer para confirmar que la relación `organizador` está cargada en el JWT.

---

### Sub-Task 3 — Backend: `ImportController` y `ImportModule`

**Status:** `[ ] pending`

**Intent**  
Crear el controller que recibe el archivo CSV vía `multipart/form-data` con el decorador
`@UseInterceptors(FileInterceptor('file'))` de NestJS/multer, y el módulo que lo registra.

**Expected Outcomes**
- `POST /import/asegurados` con campo `file` → devuelve `{ inserted, skipped, errors }`.
- Igual para las otras 8 entidades.
- Todos los endpoints requieren `@Roles(UserRole.ORGANIZADOR)`.
- Swagger muestra cada endpoint con `@ApiConsumes('multipart/form-data')`.
- `ImportModule` registrado en `app.module.ts`.

**Todo List**
1. Crear `apps/api/src/import/import.controller.ts`:
   - `@Controller('import')`, `@Roles(UserRole.ORGANIZADOR)`, `@ApiBearerAuth()`.
   - Nueve `@Post('<entidad>')` con `@UseInterceptors(FileInterceptor('file'))`.
   - Cada acción recibe `@UploadedFile() file: Express.Multer.File` y `@CurrentUser() usuario`.
   - Llama al método correspondiente de `ImportService`.
   - `@ApiConsumes('multipart/form-data')` + `@ApiBody` con campo `file`.
2. Crear `apps/api/src/import/import.module.ts`:
   - `TypeOrmModule.forFeature([ Asegurado, BienAsegurado, CompaniaAseguradora, Cuota, Endoso,
     Poliza, Productor, Reclamo, Siniestro, Organizador ])`.
3. Registrar `ImportModule` en `apps/api/src/app.module.ts`.

**Relevant Context**
- Pattern idéntico al `ExportController`: `apps/api/src/export/export.controller.ts`.
- `FileInterceptor` viene de `@nestjs/platform-express` (ya instalado).
- `@CurrentUser()` decorator: `apps/api/src/auth/decorators/current-user.decorator.ts`.
- `Organizador` entity: `apps/api/src/database/entities/organizador.entity.ts` — necesaria para
  resolver el organizador del productor durante el import.

---

### Sub-Task 4 — Frontend: sección "Importar" en la página de transferencia

**Status:** `[ ] pending`

**Intent**  
Extender `apps/web/src/pages/ExportarPage.tsx` para incluir una sección de importación debajo
de la de exportación. Cada entidad tiene un file-picker + botón "Importar CSV" que sube el
archivo y muestra el resultado `{ inserted, skipped, errors }` inline.

El orden de importación recomendado se muestra como nota visual en la UI (con números 1-9).

**Expected Outcomes**
- La página existente en `/exportar` conserva intacta la sección de exportación.
- Debajo hay una nueva sección "Importar datos" con las mismas 9 entidades.
- Cada fila tiene: nombre, orden recomendado, file-input, botón "Subir", resultado inline.
- El resultado muestra en verde `X insertados`, en amarillo `X omitidos (ya existían)`, y en
  rojo los errores con número de fila y mensaje.
- El file-picker acepta solo `.csv`.
- El botón "Subir" se deshabilita si no hay archivo seleccionado o si está cargando.

**Todo List**
1. Agregar función `importCsv(entity: string, file: File)` en la página:
   - Crea un `FormData` con el archivo bajo el campo `"file"`.
   - Llama `api.post('/import/' + entity, formData, { headers: { 'Content-Type': 'multipart/form-data' } })`.
   - Retorna `{ inserted, skipped, errors }`.
2. Agregar estado por entidad: `importState: Record<string, { file, loading, result, error }>`.
3. Renderizar la sección "Importar datos" con las 9 filas (en el orden correcto de dependencias).
   Cada fila:
   - Número de orden (badge).
   - Nombre de la entidad.
   - `<input type="file" accept=".csv">` controlado.
   - Botón "Subir CSV" (disabled si sin archivo o loading).
   - Resultado inline: badges verde/amarillo + lista de errores expandible.
4. Agregar título de sección con separador visual entre exportación e importación.
5. **No crear una nueva página ni una nueva ruta** — todo queda en `/exportar`.

**Relevant Context**
- Página existente: `apps/web/src/pages/ExportarPage.tsx`.
- `api` axios instance: `apps/web/src/lib/api.ts` — el JWT ya se adjunta automáticamente.
- El orden de importación recomendado está definido en "Orden de importación obligatorio" arriba.
- Para `multipart/form-data` con axios basta con pasar el `FormData` directamente; axios detecta
  el tipo y setea el header correcto (no hace falta setearlo manualmente).
