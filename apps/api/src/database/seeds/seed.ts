import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Organizador } from '../entities/organizador.entity';
import { Productor } from '../entities/productor.entity';
import { Asegurado } from '../entities/asegurado.entity';
import { BienAsegurado } from '../entities/bien-asegurado.entity';
import { CompaniaAseguradora } from '../entities/compania-aseguradora.entity';
import { Poliza } from '../entities/poliza.entity';
import { Endoso } from '../entities/endoso.entity';
import { Cuota } from '../entities/cuota.entity';
import { Siniestro } from '../entities/siniestro.entity';
import { Reclamo } from '../entities/reclamo.entity';
import {
  EstadoCuota,
  EstadoPoliza,
  EstadoProductor,
  EstadoReclamo,
  EstadoSiniestro,
  PeriodicidadRefacturacion,
  TipoBien,
  TipoReclamo,
  TipoSiniestro,
  UsoVehiculo,
} from '@gestion-pas/types';

async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Conectado a la base de datos');

  // ── Limpiar tablas en orden (respetar FK) ─────────────────────────
  await AppDataSource.query('DELETE FROM documentos');
  await AppDataSource.query('DELETE FROM reclamos');
  await AppDataSource.query('DELETE FROM siniestros');
  await AppDataSource.query('DELETE FROM cuotas');
  await AppDataSource.query('DELETE FROM endosos');
  await AppDataSource.query('DELETE FROM polizas');
  await AppDataSource.query('DELETE FROM bienes_asegurados');
  await AppDataSource.query('DELETE FROM asegurados');
  await AppDataSource.query('DELETE FROM productores');
  await AppDataSource.query('DELETE FROM companias_aseguradoras');
  await AppDataSource.query('DELETE FROM organizadores');
  console.log('✓ Tablas limpiadas');

  const orgRepo      = AppDataSource.getRepository(Organizador);
  const prodRepo     = AppDataSource.getRepository(Productor);
  const asegRepo     = AppDataSource.getRepository(Asegurado);
  const bienRepo     = AppDataSource.getRepository(BienAsegurado);
  const compRepo     = AppDataSource.getRepository(CompaniaAseguradora);
  const polizaRepo   = AppDataSource.getRepository(Poliza);
  const endosoRepo   = AppDataSource.getRepository(Endoso);
  const cuotaRepo    = AppDataSource.getRepository(Cuota);
  const siniestroRepo= AppDataSource.getRepository(Siniestro);
  const reclamoRepo  = AppDataSource.getRepository(Reclamo);

  // ── Organizador ───────────────────────────────────────────────────
  const org = orgRepo.create({
    nombre: 'María Florencia Mangialavori',
    dniCuil: '27242058203',
    telefono: '+5491168088361',
    email: 'florencia@gestionpas.com.ar',
  });
  await orgRepo.save(org);
  console.log('✓ Organizador creado');

  // ── Productores (4) ───────────────────────────────────────────────
  const [prod1, prod2, prod3, _prod4] = await prodRepo.save([
    prodRepo.create({
      nombre: 'Leandro García',
      dniCuil: '20345678901',
      telefono: '+5491155551111',
      email: 'leandro@gestionpas.com.ar',
      fechaIncorporacion: new Date('2020-03-01'),
      companiasOpera: 'Federación Patronal, Galicia Seguros',
      estado: EstadoProductor.ACTIVO,
      organizador: org,
    }),
    prodRepo.create({
      nombre: 'Sofía Rodríguez',
      dniCuil: '27456789012',
      telefono: '+5491155552222',
      email: 'sofia@gestionpas.com.ar',
      fechaIncorporacion: new Date('2021-06-15'),
      companiasOpera: 'La Equitativa, Federación Patronal',
      estado: EstadoProductor.ACTIVO,
      organizador: org,
    }),
    prodRepo.create({
      nombre: 'Marcelo Vázquez',
      dniCuil: '20567890123',
      telefono: '+5491155553333',
      email: 'marcelo.vazquez@gestionpas.com.ar',
      fechaIncorporacion: new Date('2019-09-01'),
      companiasOpera: 'Galicia Seguros, Sancor Seguros',
      estado: EstadoProductor.ACTIVO,
      organizador: org,
    }),
    prodRepo.create({
      nombre: 'Patricia Moreno',
      dniCuil: '27678901234',
      telefono: '+5491155554444',
      email: 'patricia.moreno@gestionpas.com.ar',
      fechaIncorporacion: new Date('2022-01-10'),
      companiasOpera: 'La Equitativa',
      estado: EstadoProductor.INACTIVO,
      organizador: org,
    }),
  ]);
  console.log('✓ Productores creados (4)');

  // ── Asegurados (9) ────────────────────────────────────────────────
  const [aseg1, aseg2, aseg3, aseg4, aseg5, aseg6, aseg7, aseg8, aseg9] =
    await asegRepo.save([
      asegRepo.create({
        nombre: 'Carlos Martínez',
        dniCuil: '20123456789',
        fechaNacimiento: new Date('1985-04-12'),
        direccion: 'Av. Mitre 1234, San Martín',
        codigoPostal: '1650',
        telefono: '+5491166661111',
        email: 'carlos.martinez@email.com',
        productor: prod1,
      }),
      asegRepo.create({
        nombre: 'Laura González',
        dniCuil: '27234567890',
        fechaNacimiento: new Date('1990-08-22'),
        direccion: 'Rivadavia 567, CABA',
        codigoPostal: '1002',
        telefono: '+5491166662222',
        email: 'laura.gonzalez@email.com',
        productor: prod1,
      }),
      asegRepo.create({
        nombre: 'Roberto Pérez',
        dniCuil: '20345678902',
        fechaNacimiento: new Date('1978-11-30'),
        direccion: 'Belgrano 890, Caseros',
        codigoPostal: '1678',
        telefono: '+5491166663333',
        productor: prod2,           // sin email — dato incompleto parcial
      }),
      asegRepo.create({
        nombre: 'Graciela Torres',
        dniCuil: '27456789013',
        fechaNacimiento: new Date('1965-03-07'),
        telefono: '+5491166664444',
        email: 'graciela.torres@email.com',
        productor: prod2,
      }),
      asegRepo.create({
        nombre: 'Diego Fernández',
        dniCuil: '20567890124',
        fechaNacimiento: new Date('1992-07-19'),
        direccion: 'Corrientes 2345, CABA',
        codigoPostal: '1045',
        telefono: '+5491166665555',
        email: 'diego.fernandez@email.com',
        productor: prod3,
      }),
      asegRepo.create({
        nombre: 'Ana Suárez',
        dniCuil: '27678901235',
        fechaNacimiento: new Date('1988-12-03'),
        direccion: 'San Martín 456, Ramos Mejía',
        codigoPostal: '1704',
        email: 'ana.suarez@email.com',
        productor: prod3,           // sin teléfono
      }),
      asegRepo.create({
        nombre: 'Héctor Romero',
        dniCuil: '20789012346',
        fechaNacimiento: new Date('1970-05-25'),
        telefono: '+5491166667777',
        productor: prod1,           // sin dirección, sin email
      }),
      asegRepo.create({
        nombre: 'Valeria Castillo',
        dniCuil: '27890123457',
        fechaNacimiento: new Date('1995-02-14'),
        direccion: 'Avellaneda 789, Morón',
        codigoPostal: '1708',
        telefono: '+5491166668888',
        email: 'valeria.castillo@email.com',
        productor: prod2,
      }),
      asegRepo.create({
        nombre: 'Pablo Giménez',
        dniCuil: '20901234568',
        fechaNacimiento: new Date('1983-09-11'),
        direccion: 'Hipólito Yrigoyen 321, Lomas de Zamora',
        codigoPostal: '1832',
        telefono: '+5491166669999',
        email: 'pablo.gimenez@email.com',
        productor: prod3,
      }),
    ]);
  console.log('✓ Asegurados creados (9)');

  // ── Compañías aseguradoras (4) ────────────────────────────────────
  const [compFed, compEquit, compGalicia, compSancor] = await compRepo.save([
    compRepo.create({
      nombre: 'Federación Patronal',
      periodoDGraciaDias: 10,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      mecanismoNotificacion: 'portal',
    }),
    compRepo.create({
      nombre: 'La Equitativa del Plata',
      periodoDGraciaDias: 5,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      mecanismoNotificacion: 'email',
    }),
    compRepo.create({
      nombre: 'Galicia Seguros',
      periodoDGraciaDias: 7,
      periodicidadRefacturacion: PeriodicidadRefacturacion.TRIMESTRAL,
      mecanismoNotificacion: 'portal',
    }),
    compRepo.create({
      nombre: 'Sancor Seguros',
      periodoDGraciaDias: 3,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      mecanismoNotificacion: 'ninguno',
    }),
  ]);
  console.log('✓ Compañías creadas (4)');

  // ── Bienes asegurados (12) ────────────────────────────────────────
  // Variedad: autos completos, autos con datos incompletos, hogar, vida, otro
  const [
    bienAuto1, _bienAuto2, bienAuto3, bienAuto4,
    bienAutoInc1, bienAutoInc2, _bienAutoInc3,
    bienHogar1, bienHogar2, _bienHogarInc,
    bienVida1, bienOtro1,
  ] = await bienRepo.save([
    // Autos completos
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: 8500000,
      patente: 'AB123CD',
      marca: 'Peugeot',
      modelo: '208',
      version: 'Active 1.2 PureTech',
      anioFabricacion: 2021,
      uso: UsoVehiculo.PARTICULAR,
      tieneGnc: false,
      asegurado: aseg1,
    }),
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: 12000000,
      patente: 'EF456GH',
      marca: 'Toyota',
      modelo: 'Corolla',
      version: 'XEI 2.0',
      anioFabricacion: 2022,
      uso: UsoVehiculo.PARTICULAR,
      tieneGnc: false,
      asegurado: aseg2,
    }),
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: 6200000,
      patente: 'IJ789KL',
      marca: 'Volkswagen',
      modelo: 'Gol',
      version: 'Trend 1.6',
      anioFabricacion: 2019,
      uso: UsoVehiculo.COMERCIAL,
      tieneGnc: true,
      asegurado: aseg3,
    }),
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: 22000000,
      patente: 'MN012OP',
      marca: 'Ford',
      modelo: 'Ranger',
      version: 'XLT 3.2 TD 4x4',
      anioFabricacion: 2023,
      uso: UsoVehiculo.COMERCIAL,
      tieneGnc: false,
      asegurado: aseg5,
    }),
    // Autos con datos incompletos (sin suma asegurada, sin marca/modelo, etc.)
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: null,          // falta suma
      patente: 'QR345ST',
      marca: 'Renault',
      modelo: 'Sandero',
      anioFabricacion: 2020,
      uso: UsoVehiculo.PARTICULAR,
      tieneGnc: false,
      asegurado: aseg4,
    }),
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: 7000000,
      patente: 'UV678WX',
      marca: null,                  // falta marca
      modelo: null,                 // falta modelo
      anioFabricacion: null,        // falta año
      uso: UsoVehiculo.PARTICULAR,
      tieneGnc: false,
      asegurado: aseg7,
    }),
    bienRepo.create({
      tipo: TipoBien.AUTOMOTOR,
      sumaAsegurada: null,          // falta suma
      patente: null,                // falta patente
      marca: 'Honda',
      modelo: 'Civic',
      anioFabricacion: 2018,
      uso: UsoVehiculo.PARTICULAR,
      tieneGnc: false,
      asegurado: aseg8,
    }),
    // Hogar completo
    bienRepo.create({
      tipo: TipoBien.HOGAR,
      sumaAsegurada: 15000000,
      asegurado: aseg2,
    }),
    bienRepo.create({
      tipo: TipoBien.HOGAR,
      sumaAsegurada: 9500000,
      asegurado: aseg6,
    }),
    // Hogar incompleto (sin suma)
    bienRepo.create({
      tipo: TipoBien.HOGAR,
      sumaAsegurada: null,          // falta suma
      asegurado: aseg9,
    }),
    // Vida
    bienRepo.create({
      tipo: TipoBien.VIDA,
      sumaAsegurada: 50000000,
      asegurado: aseg4,
    }),
    // Otro
    bienRepo.create({
      tipo: TipoBien.OTRO,
      sumaAsegurada: 3000000,
      asegurado: aseg1,
    }),
  ]);
  console.log('✓ Bienes creados (12 — 4 con datos incompletos)');

  // ── Pólizas (10) ──────────────────────────────────────────────────
  // Variedad: activas vigentes, activa con vigencia vencida (se auto-suspenderá),
  // suspendida manual, anulada, historial de cuotas variado
  const hoy = new Date();
  const make = (y: number, m: number, d: number) => new Date(y, m - 1, d);

  const [
    pol1, pol2, pol3, pol4, pol5,
    _pol6, pol7, pol8, pol9, pol10,
  ] = await polizaRepo.save([
    // pol1 — activa vigente (2025–2026)
    polizaRepo.create({
      numeroPoliza: 'FP-2025-00001',
      vigenciaInicio: make(2025, 1, 1),
      vigenciaFin:   make(2026, 1, 1),
      importeCuotaVigente: 68000,
      modalidadPago: 'debito_automatico',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      asegurado: aseg1, bien: bienAuto1, productor: prod1, compania: compFed,
    }),
    // pol2 — activa vigente (2025–2026), hogar
    polizaRepo.create({
      numeroPoliza: 'EQ-2025-00150',
      vigenciaInicio: make(2025, 3, 1),
      vigenciaFin:   make(2026, 3, 1),
      importeCuotaVigente: 32000,
      modalidadPago: 'transferencia',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      asegurado: aseg2, bien: bienHogar1, productor: prod1, compania: compEquit,
    }),
    // pol3 — activa (vencerá en 20 días — útil para dashboard de vencimientos)
    polizaRepo.create({
      numeroPoliza: 'GS-2024-00892',
      vigenciaInicio: new Date(new Date().setFullYear(hoy.getFullYear() - 1)),
      vigenciaFin:   new Date(new Date().setDate(hoy.getDate() + 20)),
      importeCuotaVigente: 45000,
      modalidadPago: 'efectivo',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.TRIMESTRAL,
      asegurado: aseg3, bien: bienAuto3, productor: prod2, compania: compGalicia,
    }),
    // pol4 — activa con vigencia YA VENCIDA → se auto-suspenderá al primer GET
    polizaRepo.create({
      numeroPoliza: 'FP-2024-TEST001',
      vigenciaInicio: make(2024, 1, 1),
      vigenciaFin:   make(2024, 12, 31),
      importeCuotaVigente: 55000,
      modalidadPago: 'efectivo',
      estado: EstadoPoliza.ACTIVA,   // quedará suspendida al primer GET /polizas
      asegurado: aseg1, bien: bienOtro1, productor: prod1, compania: compFed,
    }),
    // pol5 — suspendida por falta de pago
    polizaRepo.create({
      numeroPoliza: 'SC-2024-00445',
      vigenciaInicio: make(2024, 6, 1),
      vigenciaFin:   make(2025, 6, 1),
      importeCuotaVigente: 41000,
      modalidadPago: 'efectivo',
      estado: EstadoPoliza.SUSPENDIDA,
      asegurado: aseg4, bien: bienAutoInc1, productor: prod2, compania: compSancor,
    }),
    // pol6 — anulada
    polizaRepo.create({
      numeroPoliza: 'GS-2023-00210',
      vigenciaInicio: make(2023, 7, 1),
      vigenciaFin:   make(2024, 7, 1),
      importeCuotaVigente: 38000,
      modalidadPago: 'debito_automatico',
      estado: EstadoPoliza.ANULADA,
      asegurado: aseg5, bien: bienAuto4, productor: prod3, compania: compGalicia,
    }),
    // pol7 — activa, truck comercial (prod3)
    polizaRepo.create({
      numeroPoliza: 'FP-2025-00788',
      vigenciaInicio: make(2025, 2, 1),
      vigenciaFin:   make(2026, 2, 1),
      importeCuotaVigente: 95000,
      modalidadPago: 'transferencia',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      asegurado: aseg5, bien: bienAuto4, productor: prod3, compania: compFed,
    }),
    // pol8 — activa, hogar (prod2)
    polizaRepo.create({
      numeroPoliza: 'EQ-2025-00321',
      vigenciaInicio: make(2025, 1, 15),
      vigenciaFin:   make(2026, 1, 15),
      importeCuotaVigente: 28000,
      modalidadPago: 'efectivo',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      asegurado: aseg8, bien: bienHogar2, productor: prod2, compania: compEquit,
    }),
    // pol9 — activa, vida
    polizaRepo.create({
      numeroPoliza: 'SC-2025-00099',
      vigenciaInicio: make(2025, 4, 1),
      vigenciaFin:   make(2026, 4, 1),
      importeCuotaVigente: 18000,
      modalidadPago: 'debito_automatico',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      asegurado: aseg4, bien: bienVida1, productor: prod2, compania: compSancor,
    }),
    // pol10 — cuota vence en 5 días (útil para widget dashboard)
    polizaRepo.create({
      numeroPoliza: 'GS-2025-00501',
      vigenciaInicio: new Date(new Date().setFullYear(hoy.getFullYear() - 1)),
      vigenciaFin:   new Date(new Date().setDate(hoy.getDate() + 5)),
      importeCuotaVigente: 52000,
      modalidadPago: 'transferencia',
      estado: EstadoPoliza.ACTIVA,
      periodicidadRefacturacion: PeriodicidadRefacturacion.MENSUAL,
      asegurado: aseg9, bien: bienAutoInc2, productor: prod3, compania: compGalicia,
    }),
  ]);
  console.log('✓ Pólizas creadas (10)');

  // ── Endosos (8) ───────────────────────────────────────────────────
  await endosoRepo.save([
    endosoRepo.create({
      numeroEndoso: 'FP-2025-00001-E01',
      tipoModificacion: 'refacturacion',
      importeActualizado: 72000,
      sumaAseguradaActualizada: 9000000,
      fechaEmision: make(2025, 4, 1),
      poliza: pol1,
    }),
    endosoRepo.create({
      numeroEndoso: 'FP-2025-00001-E02',
      tipoModificacion: 'cambio_cobertura',
      importeActualizado: 75000,
      fechaEmision: make(2025, 6, 1),
      poliza: pol1,
    }),
    endosoRepo.create({
      numeroEndoso: 'EQ-2025-00150-E01',
      tipoModificacion: 'refacturacion',
      importeActualizado: 34000,
      fechaEmision: make(2025, 5, 1),
      poliza: pol2,
    }),
    endosoRepo.create({
      numeroEndoso: 'GS-2024-00892-E01',
      tipoModificacion: 'cambio_suma_asegurada',
      sumaAseguradaActualizada: 7000000,
      fechaEmision: make(2024, 9, 15),
      poliza: pol3,
    }),
    endosoRepo.create({
      numeroEndoso: 'FP-2025-00788-E01',
      tipoModificacion: 'refacturacion',
      importeActualizado: 102000,
      fechaEmision: make(2025, 5, 1),
      poliza: pol7,
    }),
    endosoRepo.create({
      numeroEndoso: 'SC-2024-00445-E01',
      tipoModificacion: 'suspension_por_mora',
      fechaEmision: make(2024, 10, 1),
      poliza: pol5,
    }),
    endosoRepo.create({
      numeroEndoso: 'EQ-2025-00321-E01',
      tipoModificacion: 'refacturacion',
      importeActualizado: 30000,
      fechaEmision: make(2025, 4, 15),
      poliza: pol8,
    }),
    endosoRepo.create({
      numeroEndoso: 'SC-2025-00099-E01',
      tipoModificacion: 'cambio_beneficiario',
      fechaEmision: make(2025, 5, 10),
      poliza: pol9,
    }),
  ]);
  console.log('✓ Endosos creados (8)');

  // ── Cuotas ────────────────────────────────────────────────────────
  // Helper: genera N cuotas mensuales a partir de una fecha base
  function genCuotas(
    poliza: Poliza,
    importe: number,
    desde: Date,
    cantidad: number,
    estados: EstadoCuota[],
  ) {
    return Array.from({ length: cantidad }, (_, i) => {
      const venc = new Date(desde);
      venc.setMonth(venc.getMonth() + i);
      const estado = estados[i] ?? EstadoCuota.PENDIENTE;
      return cuotaRepo.create({
        numeroCuota: i + 1,
        importe,
        fechaVencimiento: venc,
        estado,
        fechaPagoEfectivo:
          estado === EstadoCuota.PAGADA ? new Date(venc.getTime() - 86400000 * 2) : null,
        medioPago: estado === EstadoCuota.PAGADA ? 'debito_automatico' : null,
        poliza,
      });
    });
  }

  const cuotasData = [
    // pol1 — 6 cuotas: 4 pagadas, 1 rechazada, 1 pendiente próxima
    ...genCuotas(pol1, 68000, make(2025, 2, 10), 6, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PAGADA,
      EstadoCuota.RECHAZADA, EstadoCuota.PENDIENTE,
    ]),
    // pol2 — 4 cuotas pagadas + 2 pendientes
    ...genCuotas(pol2, 32000, make(2025, 4, 5), 6, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PAGADA,
      EstadoCuota.PENDIENTE, EstadoCuota.PENDIENTE,
    ]),
    // pol3 — cuota que vence en 20 días (para R2 vencimientos)
    cuotaRepo.create({
      numeroCuota: 1, importe: 45000,
      fechaVencimiento: new Date(new Date().setDate(hoy.getDate() + 20)),
      estado: EstadoCuota.PENDIENTE, poliza: pol3,
    }),
    // pol4 — cuotas vencidas (póliza con vigencia pasada)
    ...genCuotas(pol4, 55000, make(2024, 1, 10), 3, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.VENCIDA,
    ]),
    // pol5 — suspendida: 2 pagadas, 1 rechazada que causó suspensión
    ...genCuotas(pol5, 41000, make(2024, 7, 5), 3, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.RECHAZADA,
    ]),
    // pol7 — 3 pagadas + 1 pendiente
    ...genCuotas(pol7, 95000, make(2025, 3, 1), 4, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PENDIENTE,
    ]),
    // pol8 — 3 pendientes
    ...genCuotas(pol8, 28000, make(2025, 2, 15), 3, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PENDIENTE,
    ]),
    // pol9 — 2 pagadas + 1 pendiente
    ...genCuotas(pol9, 18000, make(2025, 5, 1), 3, [
      EstadoCuota.PAGADA, EstadoCuota.PAGADA, EstadoCuota.PENDIENTE,
    ]),
    // pol10 — cuota que vence en 5 días
    cuotaRepo.create({
      numeroCuota: 1, importe: 52000,
      fechaVencimiento: new Date(new Date().setDate(hoy.getDate() + 5)),
      estado: EstadoCuota.PENDIENTE, poliza: pol10,
    }),
  ];
  await cuotaRepo.save(cuotasData);
  console.log(`✓ Cuotas creadas (${cuotasData.length})`);

  // ── Siniestros (6) ────────────────────────────────────────────────
  await siniestroRepo.save([
    siniestroRepo.create({
      tipo: TipoSiniestro.COLISION,
      fechaOcurrencia: make(2025, 5, 14),
      horaOcurrencia: '08:30',
      lugarOcurrencia: 'Av. San Martín y Belgrano, San Martín',
      relato: 'Colisión trasera en semáforo en rojo. Vehículo dañado en paragolpes trasero y carrocería.',
      datosTerceros: 'Vehículo Fiat Cronos, dominio JK456LM, conductor Martín López, tel 1145678901',
      estado: EstadoSiniestro.EN_GESTION,
      numeroDenunciaCompania: 'FP-SIN-2025-00891',
      asegurado: aseg1, bien: bienAuto1, productor: prod1, compania: compFed,
    }),
    siniestroRepo.create({
      tipo: TipoSiniestro.ROBO_AUTOPARTES,
      fechaOcurrencia: make(2025, 6, 2),
      horaOcurrencia: '02:15',
      lugarOcurrencia: 'Calle Urquiza 340, Caseros',
      relato: 'Sustracción de ruedas y volante. Vehículo encontrado sobre ladrillos.',
      datosTerceros: null,
      estado: EstadoSiniestro.ABIERTO,
      asegurado: aseg3, bien: bienAuto3, productor: prod2, compania: compGalicia,
    }),
    siniestroRepo.create({
      tipo: TipoSiniestro.HOGAR,
      fechaOcurrencia: make(2025, 4, 20),
      lugarOcurrencia: 'Domicilio asegurado',
      relato: 'Inundación por desborde de desagüe pluvial. Daños en piso y mobiliario de cocina.',
      estado: EstadoSiniestro.RESUELTO,
      numeroDenunciaCompania: 'EQ-SIN-2025-00234',
      asegurado: aseg2, bien: bienHogar1, productor: prod1, compania: compEquit,
    }),
    siniestroRepo.create({
      tipo: TipoSiniestro.COLISION,
      fechaOcurrencia: make(2025, 3, 8),
      horaOcurrencia: '17:45',
      lugarOcurrencia: 'Ruta 3 km 24, Lomas de Zamora',
      relato: 'Impacto lateral en cruce sin semáforo.',
      datosTerceros: 'Sin datos del tercero — se fugó de la escena',
      estado: EstadoSiniestro.RECHAZADO,
      numeroDenunciaCompania: 'GS-SIN-2025-00112',
      asegurado: aseg5, bien: bienAuto4, productor: prod3, compania: compGalicia,
    }),
    siniestroRepo.create({
      tipo: TipoSiniestro.ROBO_TOTAL,
      fechaOcurrencia: make(2025, 6, 18),
      horaOcurrencia: '23:00',
      lugarOcurrencia: 'Av. Corrientes 2300, CABA',
      relato: 'Robo total del vehículo a mano armada.',
      estado: EstadoSiniestro.ABIERTO,
      asegurado: aseg5, bien: bienAuto4, productor: prod3, compania: compFed,
    }),
    siniestroRepo.create({
      tipo: TipoSiniestro.COLISION,
      fechaOcurrencia: make(2025, 6, 25),
      horaOcurrencia: '11:20',
      lugarOcurrencia: 'Hipólito Yrigoyen y Boedo, CABA',
      relato: 'Choque frontal a baja velocidad en zona de obras.',
      estado: EstadoSiniestro.ABIERTO,
      asegurado: aseg9, bien: bienAutoInc2, productor: prod3, compania: compGalicia,
    }),
  ]);
  console.log('✓ Siniestros creados (6 — abierto/gestión/resuelto/rechazado)');

  // ── Reclamos (7) ──────────────────────────────────────────────────
  await reclamoRepo.save([
    reclamoRepo.create({
      tipo: TipoReclamo.COBERTURA,
      descripcion: 'La compañía no reconoce el siniestro del 14/05 alegando falta de documentación.',
      estado: EstadoReclamo.EN_GESTION,
      fechaApertura: make(2025, 5, 20),
      asegurado: aseg1, productor: prod1, compania: compFed,
    }),
    reclamoRepo.create({
      tipo: TipoReclamo.FACTURACION,
      descripcion: 'Débito duplicado en el mes de abril. Se cobró dos veces la cuota 3.',
      estado: EstadoReclamo.RESUELTO,
      fechaApertura: make(2025, 4, 18),
      asegurado: aseg2, productor: prod1, compania: compEquit,
    }),
    reclamoRepo.create({
      tipo: TipoReclamo.ADMINISTRATIVO,
      descripcion: 'No recibo el certificado de cobertura actualizado después del endoso.',
      estado: EstadoReclamo.ABIERTO,
      fechaApertura: make(2025, 6, 10),
      asegurado: aseg3, productor: prod2, compania: compGalicia,
    }),
    reclamoRepo.create({
      tipo: TipoReclamo.COBERTURA,
      descripcion: 'Rechazo injustificado del siniestro por robo de autopartes.',
      estado: EstadoReclamo.ABIERTO,
      fechaApertura: make(2025, 6, 5),
      asegurado: aseg3, productor: prod2, compania: compGalicia,
    }),
    reclamoRepo.create({
      tipo: TipoReclamo.FACTURACION,
      descripcion: 'El importe de la cuota no corresponde al endoso vigente.',
      estado: EstadoReclamo.ABIERTO,
      fechaApertura: make(2025, 6, 22),
      asegurado: aseg5, productor: prod3, compania: null,
    }),
    reclamoRepo.create({
      tipo: TipoReclamo.ADMINISTRATIVO,
      descripcion: 'Solicitud de baja de la póliza sin respuesta en 30 días.',
      estado: EstadoReclamo.RESUELTO,
      fechaApertura: make(2025, 3, 1),
      asegurado: aseg4, productor: prod2, compania: compSancor,
    }),
    reclamoRepo.create({
      tipo: TipoReclamo.OTRO,
      descripcion: null,
      estado: EstadoReclamo.ABIERTO,
      fechaApertura: make(2025, 6, 28),
      asegurado: aseg9, productor: prod3, compania: compGalicia,
    }),
  ]);
  console.log('✓ Reclamos creados (7)');

  // ── Resumen final ─────────────────────────────────────────────────
  console.log('\n✅ Seed completado exitosamente');
  console.log('   Productores: 4 (3 activos, 1 inactivo)');
  console.log('   Asegurados:  9');
  console.log('   Compañías:   4');
  console.log('   Bienes:      12 (4 con datos incompletos)');
  console.log('   Pólizas:     10 (5 activas, 1 vencida→auto-suspenderá, 1 suspendida, 1 anulada, 2 activas corto plazo)');
  console.log('   Endosos:     8');
  console.log(`   Cuotas:      ${cuotasData.length} (variadas)`);
  console.log('   Siniestros:  6 (2 abiertos, 1 en gestión, 1 resuelto, 1 rechazado, 1 robo total abierto)');
  console.log('   Reclamos:    7 (4 abiertos, 2 resueltos, 1 en gestión)');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
