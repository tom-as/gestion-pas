# Manual de Usuario — Sistema de Gestión PAS

> Versión 1.0 — Gestión PAS · Caseros / CABA

---

## Índice

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Perfiles y permisos](#2-perfiles-y-permisos)
3. [Módulo: Asegurados](#3-módulo-asegurados)
4. [Módulo: Bienes Asegurados](#4-módulo-bienes-asegurados)
5. [Módulo: Pólizas y Endosos](#5-módulo-pólizas-y-endosos)
6. [Módulo: Cuotas y Pagos](#6-módulo-cuotas-y-pagos)
7. [Módulo: Siniestros](#7-módulo-siniestros)
8. [Módulo: Reclamos](#8-módulo-reclamos)
9. [Módulo: Documentos](#9-módulo-documentos)
10. [Módulo: Productores](#10-módulo-productores)
11. [Módulo: Compañías Aseguradoras](#11-módulo-compañías-aseguradoras)
12. [Módulo: Reportes](#12-módulo-reportes)
13. [Flujos de trabajo frecuentes](#13-flujos-de-trabajo-frecuentes)
14. [Preguntas frecuentes (FAQ)](#14-preguntas-frecuentes-faq)

---

## 1. Acceso al sistema

### 1.1 Iniciar sesión

1. Abrir el navegador y dirigirse a la dirección del sistema (por ej. `https://app.gestionpas.com.ar`).
2. Ingresar el **correo electrónico** registrado en el campo _"Usuario"_.
3. Ingresar la **contraseña** en el campo _"Contraseña"_.
4. Presionar el botón **Ingresar**.

Si las credenciales son correctas, el sistema redirige al **Dashboard** correspondiente al perfil del usuario.

> **Nota:** El sistema cierra la sesión automáticamente si el token expira (por defecto, 24 h de inactividad). En ese caso, redirige al login y muestra el mensaje _"Sesión expirada"_.

### 1.2 Olvidé mi contraseña

En la v1, el restablecimiento de contraseña debe solicitarse al **organizador** de la red, quien puede desactivar y reactivar el usuario para asignar una nueva credencial.

---

## 2. Perfiles y permisos

El sistema tiene tres perfiles. Cada usuario tiene **un solo perfil** asignado al momento de su creación.

| Perfil | Descripción | Acceso |
|---|---|---|
| **Organizador** | Socios de Gestión PAS | Visibilidad total. Puede crear usuarios, productores y compañías. |
| **Productor** | Agentes PAS de la red | Solo su cartera: asegurados, pólizas, siniestros y reclamos asignados a él. |
| **Asegurado** | Clientes del sistema | (habilitado en v2) Solo su propia información. |

### Restricciones importantes

- Un **productor** nunca puede ver ni modificar registros de la cartera de otro productor.
- Solo el **organizador** puede crear nuevos usuarios, productores y compañías.
- Los reportes avanzados (R1–R7) están disponibles para organizadores y productores.

---

## 3. Módulo: Asegurados

### 3.1 Listar asegurados

Navegue a **Asegurados** en el menú lateral.

- El **organizador** ve la nómina completa de todos los asegurados de la red.
- El **productor** ve solo los asegurados de su cartera.
- Use la barra de búsqueda para filtrar por **nombre** o **DNI/CUIL**.

### 3.2 Alta de asegurado

1. Presionar el botón **+ Nuevo asegurado**.
2. Completar los campos:
   - **Nombre completo** _(requerido)_
   - **DNI / CUIL** _(requerido — debe ser único en el sistema)_
   - **Productor asignado** _(requerido — selector desplegable)_
   - Dirección, código postal, teléfono, email _(opcionales)_
   - Fecha de nacimiento _(opcional)_
3. Presionar **Guardar**.

> **Error 409:** Si el DNI/CUIL ya existe en el sistema, el formulario muestra el mensaje _"Ya existe un asegurado con ese DNI/CUIL"_. Verificar si el asegurado ya está cargado buscando en el listado.

### 3.3 Editar asegurado

1. Hacer clic sobre el nombre del asegurado en el listado (o usar el ícono de edición ✏️).
2. Modificar los campos deseados.
3. Presionar **Guardar cambios**.

---

## 4. Módulo: Bienes Asegurados

Los bienes siempre están vinculados a un asegurado específico.

### 4.1 Ver bienes de un asegurado

Desde la ficha del asegurado, hacer clic en la pestaña **Bienes** o acceder desde el menú **Bienes**.

### 4.2 Registrar un bien

1. Presionar **+ Nuevo bien**.
2. Seleccionar el **Asegurado** al que pertenece.
3. Seleccionar el **Tipo de bien**:
   - **Automotor** → campos adicionales: patente, marca, modelo, año, uso (particular/comercial), VIN
   - **Hogar** → dirección del inmueble, superficie, suma asegurada
   - **Vida** → suma asegurada, beneficiario
   - **Otro** → descripción libre
4. Completar la **Suma asegurada**.
5. Presionar **Guardar**.

> **Importante:** Los bienes automotor con patente vacía aparecen en el reporte de _Datos incompletos_ (R7).

---

## 5. Módulo: Pólizas y Endosos

### 5.1 Listar pólizas

Navegue a **Pólizas** en el menú lateral. Se muestran las pólizas según el perfil:
- **Organizador:** todas las pólizas de la red.
- **Productor:** solo las pólizas de su cartera.

Los estados posibles son: `activa`, `suspendida`, `anulada`.

> **Auto-suspensión:** El sistema suspende automáticamente las pólizas cuya fecha de vigencia fin haya pasado, sin necesidad de intervención manual.

### 5.2 Registrar una póliza

1. Presionar **+ Nueva póliza**.
2. Completar:
   - **Número de póliza** (según compañía aseguradora)
   - **Asegurado** (selector)
   - **Bien asegurado** (selector — muestra solo los bienes del asegurado elegido)
   - **Productor** (selector)
   - **Compañía aseguradora** (selector)
   - **Vigencia inicio / fin** (fechas en formato DD/MM/AAAA)
   - **Importe de cuota vigente** (monto en pesos)
   - **Estado inicial** (generalmente `activa`)
3. Presionar **Guardar**.

### 5.3 Registrar un endoso

Un endoso es una modificación formal a la póliza original (cambio de suma asegurada, cambio de bien, etc.).

1. Desde la ficha de la póliza, hacer clic en **+ Endoso**.
2. Completar la descripción del cambio y la fecha.
3. Presionar **Guardar endoso**.

El historial completo de endosos se muestra en la pestaña **Endosos** de la póliza.

### 5.4 Cambiar estado de una póliza

Desde la ficha de la póliza, usar el botón **Suspender** o **Reactivar** según el estado actual.

---

## 6. Módulo: Cuotas y Pagos

### 6.1 Ver cuotas de una póliza

Desde la ficha de la póliza, acceder a la pestaña **Cuotas**.

Los estados de cuota son: `pendiente`, `pagada`, `rechazada`, `vencida`.

### 6.2 Registrar una cuota

1. Presionar **+ Nueva cuota**.
2. Completar: fecha de vencimiento, número de cuota, monto.
3. Presionar **Guardar**.

### 6.3 Marcar cuota como pagada

En la tabla de cuotas, presionar el botón **Marcar pagada** de la fila correspondiente. El estado cambia a `pagada` de forma inmediata.

### 6.4 Vencimientos próximos

Desde el menú **Reportes > R2**, o desde el widget del **Dashboard**, se pueden ver todas las cuotas con vencimiento en los próximos 30 días (o el horizonte configurado con el parámetro `?dias=N`).

---

## 7. Módulo: Siniestros

### 7.1 Listar siniestros

Navegue a **Siniestros**. Se filtran por cartera según el perfil.

Los estados del ciclo de vida son: `abierto → en gestión → resuelto / rechazado`.

### 7.2 Registrar un siniestro

1. Presionar **+ Nuevo siniestro**.
2. Seleccionar la **Póliza** afectada.
3. Completar:
   - **Tipo de siniestro** (colisión, robo total, robo autopartes, hogar, vida, otro)
   - **Fecha del siniestro**
   - **Descripción** del evento
   - **Zonas afectadas** (para siniestros de tipo automotor: usar la silueta interactiva del vehículo)
4. Presionar **Guardar**.

### 7.3 Actualizar el estado de un siniestro

Desde la ficha del siniestro:
1. Seleccionar el nuevo estado en el desplegable.
2. (Opcional) Agregar un comentario interno.
3. Presionar **Actualizar estado**.

El **asegurado** ve el estado actual mediante un **stepper visual** (línea de tiempo) pero no puede modificarlo.

---

## 8. Módulo: Reclamos

Los reclamos representan una queja o reclamación formal ante la compañía aseguradora.

### 8.1 Registrar un reclamo

1. Presionar **+ Nuevo reclamo**.
2. Seleccionar la **Póliza** y opcionalmente el **Siniestro** relacionado.
3. Completar:
   - **Tipo** (facturación, cobertura, administrativo, otro)
   - **Descripción** del reclamo
   - **Compañía aseguradora** (se rellena automáticamente desde la póliza)
4. Presionar **Guardar**.

### 8.2 Ciclo de vida del reclamo

`abierto → en gestión → resuelto`

Para avanzar el estado, usar el selector en la ficha del reclamo y presionar **Actualizar estado**.

---

## 9. Módulo: Documentos

Los documentos siempre están **vinculados a una entidad** del sistema (póliza, siniestro, cuota, reclamo, asegurado o bien).

### 9.1 Ver documentos de una entidad

1. Navegar a **Documentos** en el menú lateral.
2. Seleccionar el **Tipo de entidad** (póliza, siniestro, etc.) en el desplegable.
3. Ingresar el **ID de la entidad** (UUID).
4. Presionar **Buscar**.

### 9.2 Registrar un documento

En v1, el sistema guarda una **referencia (URL)** al archivo, que debe estar alojado previamente en un servicio de almacenamiento (Google Drive, Dropbox, OneDrive, etc.).

1. Presionar **+ Nuevo documento**.
2. Seleccionar:
   - **Tipo de documento** (póliza, comprobante de pago, fotografía de daños, documentación personal, factura de accesorios)
   - **Entidad vinculada** y su ID
   - **URL del archivo** (enlace directo al documento)
   - Descripción opcional
3. Presionar **Guardar**.

---

## 10. Módulo: Productores

> Solo disponible para el **organizador**.

### 10.1 Listar productores

Navegue a **Productores**. Se muestra la nómina completa con estado (activo/inactivo).

### 10.2 Incorporar un productor

1. Presionar **+ Nuevo productor**.
2. Completar: nombre completo, DNI/CUIL, email, teléfono, matrícula, estado.
3. Presionar **Guardar**.

### 10.3 Crear credenciales para el productor

Una vez creado el productor, crear su usuario de acceso:
1. Navegar a **Admin > Usuarios** (si aplica) o usar el endpoint `POST /api/auth/users`.
2. Asociar el usuario al **productor** recién creado.

---

## 11. Módulo: Compañías Aseguradoras

> Solo disponible para el **organizador**.

### 11.1 Registrar una compañía

1. Presionar **+ Nueva compañía**.
2. Completar: nombre, CUIT, días de gracia, periodicidad de refacturación, indicar si requiere notificación.
3. Presionar **Guardar**.

Los datos de la compañía se usan al crear pólizas para aplicar las reglas de negocio correctas.

---

## 12. Módulo: Reportes

> Disponible para **organizador** y **productor**.

Navegue a **Reportes** en el menú lateral.

| Reporte | Descripción |
|---|---|
| **R1 — Cartera de asegurados** | Lista todos los asegurados con el productor asignado. |
| **R2 — Vencimientos próximos** | Cuotas `pendiente` con vencimiento en los próximos 30 días (configurable). |
| **R3 — Siniestros por estado** | Resumen y filtro de siniestros por estado (abierto, en gestión, resuelto, rechazado). |
| **R4 — Reclamos** | Reclamos filtrados por estado, tipo y compañía. |
| **R5 — Pólizas** | Pólizas por estado o próximas a vencer. Aplica auto-suspensión antes de mostrar. |
| **R6 — Comisiones por productor** | Suma de importes de cuotas vigentes de pólizas activas por productor (proxy de comisiones). |
| **R7 — Datos incompletos** | Bienes asegurados con campos clave vacíos (patente, marca, modelo, suma asegurada). |

Cada sección de reporte es desplegable. Algunos reportes incluyen gráficos de barras y tortas.

---

## 13. Flujos de trabajo frecuentes

### Flujo A — Alta de un nuevo cliente

1. **Asegurados** → `+ Nuevo asegurado` → completar datos → **Guardar**.
2. **Bienes** → `+ Nuevo bien` → seleccionar asegurado → completar datos del bien → **Guardar**.
3. **Pólizas** → `+ Nueva póliza` → vincular asegurado + bien + compañía + productor → **Guardar**.
4. **Cuotas** → registrar las cuotas del primer período.

### Flujo B — Gestión de un siniestro

1. **Siniestros** → `+ Nuevo siniestro` → seleccionar póliza → completar datos → marcar zonas en la silueta (si es automotor) → **Guardar**.
2. El productor / organizador actualiza el estado a `en gestión` cuando la compañía toma el caso.
3. Al resolverse, actualizar a `resuelto`.
4. Si la compañía rechaza la cobertura, registrar un **Reclamo** vinculado al siniestro.

### Flujo C — Seguimiento de cuotas vencidas

1. **Reportes > R2** → ver cuotas con vencimiento en los próximos 30 días.
2. Para cada cuota, abrir la póliza correspondiente y marcarla como `pagada` al confirmar el pago, o `rechazada` si el débito fue rechazado.

### Flujo D — Incorporar un productor nuevo

1. **Productores** → `+ Nuevo productor` → completar datos → **Guardar** (solo organizador).
2. Crear el usuario de acceso asociado al productor.
3. Comunicar las credenciales al productor por un canal seguro.
4. El productor puede iniciar sesión y empezar a registrar asegurados en su cartera.

---

## 14. Preguntas frecuentes (FAQ)

**¿Puedo modificar el DNI/CUIL de un asegurado después de crearlo?**
No, el DNI/CUIL es el identificador único del asegurado en el sistema. Si se cometió un error, contactar al organizador para corregirlo manualmente.

**¿Por qué mi póliza aparece como "suspendida" si no la suspendí?**
El sistema aplica una suspensión automática a las pólizas cuya fecha de vigencia fin ya pasó. Para reactivarla, debe renovarse la vigencia y cambiar el estado a `activa`.

**¿Cómo cambio mi contraseña?**
En v1 no hay autoservicio de contraseña. Solicitar al organizador que genere una nueva.

**¿Los documentos se guardan en el sistema?**
No. En v1 el sistema guarda únicamente la **URL de referencia** al archivo (que debe estar en Google Drive, Dropbox, etc.). El archivo en sí no se sube al sistema.

**¿El asegurado puede ver su propia información?**
El perfil asegurado está previsto para v2. En v1 solo organizadores y productores usan el sistema.

**¿Puedo eliminar un asegurado o póliza?**
No. El sistema de gestión no tiene eliminaciones físicas en v1 — todo se desactiva o se marca como anulado para preservar la trazabilidad histórica.

**¿Con qué frecuencia se actualizan los reportes?**
Los reportes leen los datos en tiempo real al momento de abrirlos. No hay caché ni informes programados.

**¿Dónde veo el historial de cambios de una póliza?**
En la ficha de la póliza, pestaña **Endosos**. Cada endoso registra el cambio formal con su fecha.

**¿Qué es un endoso?**
Un endoso es una modificación oficial a una póliza existente (cambio de suma asegurada, cambio de bien cubierto, inclusión de un conductor, etc.). Queda registrado con historial completo.

**¿Puedo usar el sistema desde el celular?**
Sí. La interfaz web es responsiva y puede usarse desde cualquier dispositivo con navegador moderno.

---

*Gestión PAS · Sistema de Gestión Interno · v1.0*
