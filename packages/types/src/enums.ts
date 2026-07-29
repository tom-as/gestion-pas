// ─────────────────────────────────────────────
// Enums de perfiles de usuario
// ─────────────────────────────────────────────
export enum UserRole {
  ORGANIZADOR = 'organizador',
  PRODUCTOR = 'productor',
  ASEGURADO = 'asegurado',
}

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

// ─────────────────────────────────────────────
// Enums de entidades de negocio
// ─────────────────────────────────────────────
export enum TipoBien {
  AUTOMOTOR = 'automotor',
  HOGAR = 'hogar',
  VIDA = 'vida',
  OTRO = 'otro',
}

export enum UsoVehiculo {
  PARTICULAR = 'particular',
  COMERCIAL = 'comercial',
}

export enum EstadoPoliza {
  ACTIVA = 'activa',
  SUSPENDIDA = 'suspendida',
  ANULADA = 'anulada',
}

export enum PeriodicidadRefacturacion {
  MENSUAL = 'mensual',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
}

export enum EstadoCuota {
  PENDIENTE = 'pendiente',
  PAGADA = 'pagada',
  RECHAZADA = 'rechazada',
  VENCIDA = 'vencida',
}

export enum TipoSiniestro {
  COLISION = 'colision',
  ROBO_TOTAL = 'robo_total',
  ROBO_AUTOPARTES = 'robo_autopartes',
  HOGAR = 'hogar',
  VIDA = 'vida',
  OTRO = 'otro',
}

export enum EstadoSiniestro {
  ABIERTO = 'abierto',
  EN_GESTION = 'en_gestion',
  RESUELTO = 'resuelto',
  RECHAZADO = 'rechazado',
}

export enum TipoReclamo {
  FACTURACION = 'facturacion',
  COBERTURA = 'cobertura',
  ADMINISTRATIVO = 'administrativo',
  OTRO = 'otro',
}

export enum EstadoReclamo {
  ABIERTO = 'abierto',
  EN_GESTION = 'en_gestion',
  RESUELTO = 'resuelto',
}

export enum EstadoProductor {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

export enum TipoDocumento {
  POLIZA = 'poliza',
  COMPROBANTE_PAGO = 'comprobante_pago',
  FOTOGRAFIA_DANOS = 'fotografia_danos',
  DOCUMENTACION_PERSONAL = 'documentacion_personal',
  FACTURA_ACCESORIOS = 'factura_accesorios',
}

// Entidad vinculada al documento (referencia polimórfica)
export enum EntidadDocumento {
  ASEGURADO = 'asegurado',
  BIEN = 'bien',
  POLIZA = 'poliza',
  CUOTA = 'cuota',
  SINIESTRO = 'siniestro',
  RECLAMO = 'reclamo',
}
