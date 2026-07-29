# PRD — Sistema de Gestión Gestión PAS

> Documento destilado a partir de la Propuesta Técnica (Entrega Acumulativa 4).  
> Propietario: Tomás Arbía · Cliente: Gestión PAS (María Florencia Mangialavori)

---

## 1. Contexto del negocio

**Gestión PAS** es un broker organizador de seguros radicado en Caseros, CABA.  
Opera como nexo entre ~40-70 Productores Asesores de Seguros (PAS) y las compañías aseguradoras.  
La operatoria actual se apoya en tres herramientas no integradas: WhatsApp + Excel personal de cada productor + portales web de cada aseguradora.

**Problema central:** la información de la organización vive fragmentada; no existe un padrón propio ni trazabilidad de ningún proceso.

---

## 2. Perfiles de usuario

| Perfil | Cantidad | Alcance de visibilidad |
|---|---|---|
| **Organizador** | 4 socios fundadores | Toda la red (toda la información) |
| **Productor** | 40-70 PAS independientes | Solo su propia cartera |
| **Asegurado** | N clientes | Solo su propia información |

---

## 3. Módulos funcionales (11 en total)

### M1 · Usuarios y Autenticación
- Login con credenciales propias (sin SSO externo)
- Control de acceso basado en 3 roles (RBAC)
- Gestión de sesiones; revocación remota desde un punto único
- El organizador da de alta productores; el productor habilita al asegurado
- **Entidad:** Usuario {id, identificador_acceso, credencial_hash, perfil, entidad_negocio_ref, estado, ultima_sesion}

### M2 · Asegurados
- Padrón unificado: cada asegurado existe **una sola vez** identificado por DNI/CUIL
- Alta, consulta y modificación
- Búsqueda por nombre, DNI, número de póliza
- **Entidad:** Asegurado {id, nombre_completo*, dni_cuil*(único), fecha_nacimiento, dirección, cp, teléfono, email, productor_asignado*}

### M3 · Bienes Asegurados
- Alta guiada por tipo de bien (automotor / hogar / vida / otro)
- Para automotor: captura estructurada incluyendo patente*, marca, modelo, versión, año, uso, GNC, accesorios + docs respaldatorios
- Registro de modificaciones del bien a lo largo del tiempo
- **Entidad:** BienAsegurado {id, tipo*, asegurado_titular*, suma_asegurada*, patente(si auto)*, ...atributos por ramo}

### M4 · Pólizas y Endosos
- Registro interno de pólizas (el sistema NO emite, solo registra lo cargado manualmente)
- Seguimiento de endosos como entidad propia (historial completo de modificaciones)
- Estados: activa / suspendida / anulada
- Periodicidad de refacturación: mensual / trimestral / semestral / anual
- **Entidades:** Póliza {id, nro_póliza*, compañía*, asegurado*, bien*, productor*, vigencia_inicio*, vigencia_fin*, cuota_vigente*, modalidad_pago, estado*, periodicidad_refact} · Endoso {id, póliza*, nro_endoso*, tipo_modificacion*, importe_actualizado, suma_asegurada_act, fecha_emisión*}

### M5 · Cuotas y Pagos
- Registro y seguimiento de cuotas por póliza
- Estados: pendiente / pagada / rechazada / vencida
- Vista de vencimientos próximos (reemplaza planilla manual)
- El sistema NO cobra ni accede a sistemas bancarios; el productor actualiza el estado manualmente
- **Entidad:** Cuota {id, póliza*, nro_cuota*, importe*, fecha_vencimiento*, estado*, fecha_pago_efectivo, medio_pago}

### M6 · Siniestros
- Alta estructurada del siniestro (campos definidos, no relato libre)
- Interfaz visual para marcar zona de daño en silueta de vehículo (ramo automotor)
- Seguimiento de estado: abierto / en gestión / resuelto / rechazado
- El sistema NO carga la denuncia en el portal de la aseguradora; registra el nro de denuncia asignado externamente
- La "compulsa" (subasta de talleres) queda fuera del alcance
- **Entidad:** Siniestro {id, asegurado*, bien_afectado*, productor*, tipo*, fecha_ocurrencia*, hora, lugar, relato, terceros_involucrados, fotos_ref, docs_ref, estado*, nro_denuncia_compañia, compañia*}

### M7 · Reclamos
- Alta desde el momento en que el asegurado comunica la disconformidad (antes de escalar)
- Tipos: facturación / cobertura / administrativo / otro
- Seguimiento de la cadena de derivación: asegurado → productor → organizador → compañía
- **Entidad:** Reclamo {id, asegurado*, productor*, tipo*, descripción, estado*, fecha_apertura*, compañia_ref}

### M8 · Productores
- Ficha institucional del productor (reemplaza conocimiento tácito de cada socio)
- Registro de comisiones (estructura para registrar datos extraídos manualmente de "sábanas")
- Soporte para esquemas multinivel (productor referido por otro)
- Sin funcionalidades de ranking ni KPIs de desempeño (no relevado)
- **Entidades:** Productor {id, nombre*, dni_cuil*, tel, email, fecha_incorporación, organizador_ref*, compañias_opera, estado*} · Organizador {id, nombre*, dni_cuil*, tel, email}

### M9 · Compañías Aseguradoras
- Registro de compañías y sus reglas de negocio propias
- Datos clave: período de gracia ante rechazo de pago (días), periodicidad de refacturación, mecanismo de notificación
- Usado por M5 y M4 para contextualizar alertas y periodicidades
- **Entidad:** CompañiaAseguradora {id, nombre*, período_gracia_dias, periodicidad_refact, mecanismo_notif}

### M10 · Documentación
- Almacenamiento de documentos **siempre vinculados** a una entidad + trámite
- Tipos: póliza / comprobante de pago / fotografía de daños / documentación personal / factura de accesorios
- El documento jamás se almacena suelto; debe tener un contexto
- **Entidad:** Documento {id, tipo*, entidad_vinculada*(ref polimórfica), tramite_contexto, fecha_incorporación*, archivo*}

### M11 · Reportes
- No introduce entidades propias; lee y consolida las demás
- Reportes definidos:
  1. Cartera de asegurados (padrón con productor asignado)
  2. Vencimientos próximos (cuotas)
  3. Siniestros por estado
  4. Reclamos por estado / tipo / compañía
  5. Pólizas por estado / vencimiento
  6. Comisiones por productor
  7. Registros con datos incompletos (calidad de datos)
- El organizador ve toda la red; el productor ve solo su cartera

---

## 4. Exclusiones explícitas

- Integración con portales de aseguradoras
- Integración con plataformas bancarias
- Integración con "Mi Argentina" o ARCA
- Lectura/extracción automática de "sábanas"
- Procesos contables/impositivos de la sociedad
- Auditorías ante la SSN
- Migración de datos históricos (cotizable por separado)
- Métricas/KPIs de desempeño de productores

---

## 5. Restricciones técnicas derivadas del relevamiento

- El productor **no puede** cobrar dinero: el sistema no gestiona pagos, solo monitorea estado
- La información de la organización debe ser independiente de dispositivos físicos
- Acceso remoto (la empresa opera desde 2 oficinas + modalidad remota)

---

## 6. Criterios de éxito

1. **Padrón unificado:** localizar un asegurado en <5 segundos sin preguntar a nadie
2. **Trazabilidad:** todo trámite tiene estado consultable e historial persistente
3. **Consistencia:** un dato existe en una única versión oficial
4. **Continuidad operativa:** información desacoplada de dispositivos individuales
