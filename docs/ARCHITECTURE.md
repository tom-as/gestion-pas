# Arquitectura — Sistema de Gestión Gestión PAS

---

## 1. Visión general

Sistema de gestión administrativa transaccional. Repositorio único y autónomo de la información operativa.  
**No** es un sistema de tiempo real ni de integración con externos.  
Opera como registro paralelo alimentado por carga manual/semiasistida.

---

## 2. Stack tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| **Base de datos** | PostgreSQL | Modelo relacional, integridad referencial, maduro y open source |
| **Backend (API + lógica)** | Node.js + NestJS | Estructura en controladores/servicios/repositorios = refleja la arquitectura de capas; TypeScript compartido con frontend |
| **Frontend** | React + TypeScript | Biblioteca extendida, tipado fuerte para las ~10 entidades relacionadas |
| **Despliegue** | Nube (cloud provider a definir) | Acceso remoto, backups automáticos, sin hardware propio |
| **Responsividad** | Web responsiva (1 codebase) | Cubre escritorio + móvil sin duplicar desarrollo |

---

## 3. Arquitectura de capas

```
┌──────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN                                │
│  React + TypeScript (web responsiva)                 │
│  Pantallas por módulo y por perfil de usuario        │
└──────────────────────────┬───────────────────────────┘
                           │ HTTP/REST (o tRPC)
┌──────────────────────────▼───────────────────────────┐
│  CAPA DE LÓGICA DE NEGOCIO                           │
│  NestJS — Controllers / Services                     │
│  · Validaciones (ej: DNI único, estados válidos)     │
│  · Reglas de negocio (ej: productor no cobra)        │
│  · Control de acceso RBAC (3 roles)                  │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│  CAPA DE ACCESO A DATOS                              │
│  NestJS — Repositories / TypeORM (o Prisma)          │
│  Abstrae al resto de la aplicación del motor SQL     │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│  CAPA DE DATOS                                       │
│  PostgreSQL — Base de datos relacional               │
│  Integridad referencial garantizada por FK           │
└──────────────────────────────────────────────────────┘
```

---

## 4. Modelo de datos — Diagrama de entidades (conceptual)

```
Organizador ──────< Productor >────────< Asegurado
                       │                    │
                       │              BienAsegurado
                       │                    │
                  Poliza >──────────────────┘
                    │  │
                 Endoso  Cuota
                    │
            ┌───────┴──────────┐
         Siniestro          Reclamo
            │                  │
        Documento          Documento
            
CompaniaAseguradora ─── referenciada por Poliza, Siniestro, Reclamo, Cuota

Usuario ─── referencia polimórfica a Organizador | Productor | Asegurado
```

**Regla de unicidad crítica:** `Asegurado.dni_cuil` es UNIQUE. Mismo criterio para `Productor.dni_cuil`.  
**Referencia polimórfica de Documento:** una fila Documento puede vincularse a cualquier entidad del negocio.

---

## 5. Seguridad (tres dimensiones)

| Dimensión | Mecanismo |
|---|---|
| **Confidencialidad** | RBAC: cada usuario ve solo lo que su perfil habilita. Sesiones gestionadas centralmente |
| **Integridad** | Validaciones en capa de lógica + FK en PostgreSQL. Elimina versiones divergentes del mismo dato |
| **Disponibilidad** | Backups automáticos en nube. Revocación de sesiones desde un punto único |

---

## 6. Gestión documental (transversal)

- Los documentos **siempre** se almacenan vinculados a una entidad + trámite
- Referencia polimórfica: `Documento.entidad_vinculada` puede apuntar a Asegurado, Bien, Póliza, Cuota, Siniestro o Reclamo
- El archivo binario se almacena en object storage (ej: S3, GCS) — la DB guarda solo la referencia

---

## 7. Control de acceso por módulo (matriz resumida)

| Módulo | Organizador | Productor | Asegurado |
|---|---|---|---|
| Usuarios/Auth | Administra todos | Solo su cuenta | Solo su cuenta |
| Asegurados | Lee toda la red | CRUD su cartera | Lee sus datos |
| Bienes | Lee toda la red | CRUD su cartera | Lee sus bienes |
| Pólizas/Endosos | Lee toda la red | CRUD su cartera | Lee sus pólizas |
| Cuotas/Pagos | Lee toda la red | CRUD su cartera | Lee sus cuotas |
| Siniestros | Lee toda la red + interviene | CRUD su cartera | Lee sus siniestros |
| Reclamos | Lee toda la red + interviene | CRUD su cartera | Lee sus reclamos |
| Productores | CRUD toda la red | Lee su ficha | — |
| Compañías | CRUD | Lee | — |
| Documentación | Lee toda la red + audita | CRUD su cartera | Lee/sube sus docs |
| Reportes | Toda la red | Solo su cartera | — |

---

## 8. Decisiones de diseño no triviales

1. **Sin integración externa (v1):** el sistema es un registro paralelo; la operatoria en portales de aseguradoras continúa igual. Las integraciones quedan para una v2.
2. **Endoso como entidad propia:** no un campo de la póliza, sino una tabla separada con historial. Una póliza puede tener ≤12 endosos/año solo por refacturación.
3. **Interfaz visual de daños (M6):** silueta gráfica de vehículo para marcar zona de impacto, documentado como necesidad expresa en el relevamiento.
4. **Gradualidad de acceso asegurado:** el acceso al perfil asegurado puede habilitarse en una segunda fase; la v1 puede arrancar solo con organizadores y productores.
