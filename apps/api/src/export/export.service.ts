import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Endoso } from '../database/entities/endoso.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Productor } from '../database/entities/productor.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Siniestro } from '../database/entities/siniestro.entity';

/** Escapa y entre-comilla un valor de celda según RFC 4180 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Si contiene coma, comilla doble o salto de línea → envolver en comillas y escapar comillas internas
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Formatea un valor Date (o string/null de TypeORM) como YYYY-MM-DD o vacío */
function isoDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const s = typeof value === 'string' ? value : value.toISOString();
  return s.slice(0, 10);
}

/** Ensambla un CSV completo a partir de cabeceras y filas */
function toCsv(headers: string[], rows: string[][]): string {
  const lines: string[] = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  return lines.join('\r\n');
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,

    @InjectRepository(BienAsegurado)
    private readonly bienRepo: Repository<BienAsegurado>,

    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,

    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,

    @InjectRepository(Endoso)
    private readonly endosoRepo: Repository<Endoso>,

    @InjectRepository(Poliza)
    private readonly polizaRepo: Repository<Poliza>,

    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,

    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,

    @InjectRepository(Siniestro)
    private readonly siniestroRepo: Repository<Siniestro>,
  ) {}

  // ── asegurados ──────────────────────────────────────────────────────────

  async exportAsegurados(): Promise<string> {
    const rows = await this.aseguradoRepo.find({
      relations: ['productor'],
      order: { nombre: 'ASC' },
    });

    const headers = [
      'id', 'nombre', 'dni_cuil', 'fecha_nacimiento',
      'direccion', 'codigo_postal', 'telefono', 'email',
      'productor_dni_cuil',
    ];

    const data = rows.map((a) => [
      a.id,
      a.nombre,
      a.dniCuil,
      isoDate(a.fechaNacimiento),
      a.direccion ?? '',
      a.codigoPostal ?? '',
      a.telefono ?? '',
      a.email ?? '',
      a.productor?.dniCuil ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── productores ─────────────────────────────────────────────────────────

  async exportProductores(): Promise<string> {
    const rows = await this.productorRepo.find({ order: { nombre: 'ASC' } });

    const headers = [
      'id', 'nombre', 'dni_cuil', 'telefono', 'email',
      'fecha_incorporacion', 'companias_opera', 'estado',
    ];

    const data = rows.map((p) => [
      p.id,
      p.nombre,
      p.dniCuil,
      p.telefono ?? '',
      p.email ?? '',
      isoDate(p.fechaIncorporacion),
      p.companiasOpera ?? '',
      p.estado,
    ]);

    return toCsv(headers, data);
  }

  // ── compañías ───────────────────────────────────────────────────────────

  async exportCompanias(): Promise<string> {
    const rows = await this.companiaRepo.find({ order: { nombre: 'ASC' } });

    const headers = [
      'id', 'nombre', 'periodo_gracia_dias',
      'periodicidad_refacturacion', 'mecanismo_notificacion',
    ];

    const data = rows.map((c) => [
      c.id,
      c.nombre,
      c.periodoDGraciaDias !== null ? String(c.periodoDGraciaDias) : '',
      c.periodicidadRefacturacion ?? '',
      c.mecanismoNotificacion ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── bienes ──────────────────────────────────────────────────────────────

  async exportBienes(): Promise<string> {
    const rows = await this.bienRepo.find({
      relations: ['asegurado'],
      order: { tipo: 'ASC' },
    });

    const headers = [
      'id', 'tipo', 'suma_asegurada', 'patente', 'marca', 'modelo',
      'version', 'anio_fabricacion', 'uso', 'tiene_gnc',
      'accesorios_declarados', 'asegurado_dni_cuil',
    ];

    const data = rows.map((b) => [
      b.id,
      b.tipo,
      b.sumaAsegurada !== null ? String(b.sumaAsegurada) : '',
      b.patente ?? '',
      b.marca ?? '',
      b.modelo ?? '',
      b.version ?? '',
      b.anioFabricacion !== null ? String(b.anioFabricacion) : '',
      b.uso ?? '',
      b.tieneGnc !== null ? String(b.tieneGnc) : '',
      b.accesoriosDeclarados ?? '',
      b.asegurado?.dniCuil ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── pólizas ─────────────────────────────────────────────────────────────

  async exportPolizas(): Promise<string> {
    const rows = await this.polizaRepo.find({
      relations: ['asegurado', 'bien', 'productor', 'compania'],
      order: { numeroPoliza: 'ASC' },
    });

    const headers = [
      'id', 'numero_poliza', 'vigencia_inicio', 'vigencia_fin',
      'importe_cuota_vigente', 'modalidad_pago', 'estado',
      'periodicidad_refacturacion', 'asegurado_dni_cuil',
      'bien_patente', 'bien_id', 'productor_dni_cuil', 'compania_nombre',
    ];

    const data = rows.map((p) => [
      p.id,
      p.numeroPoliza,
      isoDate(p.vigenciaInicio),
      isoDate(p.vigenciaFin),
      String(p.importeCuotaVigente),
      p.modalidadPago ?? '',
      p.estado,
      p.periodicidadRefacturacion ?? '',
      p.asegurado?.dniCuil ?? '',
      p.bien?.patente ?? '',
      p.bien?.id ?? '',
      p.productor?.dniCuil ?? '',
      p.compania?.nombre ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── endosos ─────────────────────────────────────────────────────────────

  async exportEndosos(): Promise<string> {
    const rows = await this.endosoRepo.find({
      relations: ['poliza'],
      order: { fechaEmision: 'ASC' },
    });

    const headers = [
      'id', 'numero_endoso', 'tipo_modificacion', 'fecha_emision',
      'importe_actualizado', 'suma_asegurada_actualizada', 'poliza_numero',
    ];

    const data = rows.map((e) => [
      e.id,
      e.numeroEndoso,
      e.tipoModificacion,
      isoDate(e.fechaEmision),
      e.importeActualizado !== null ? String(e.importeActualizado) : '',
      e.sumaAseguradaActualizada !== null ? String(e.sumaAseguradaActualizada) : '',
      e.poliza?.numeroPoliza ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── cuotas ──────────────────────────────────────────────────────────────

  async exportCuotas(): Promise<string> {
    const rows = await this.cuotaRepo.find({
      relations: ['poliza'],
      order: { fechaVencimiento: 'ASC' },
    });

    const headers = [
      'id', 'numero_cuota', 'importe', 'fecha_vencimiento',
      'estado', 'fecha_pago_efectivo', 'medio_pago', 'poliza_numero',
    ];

    const data = rows.map((c) => [
      c.id,
      String(c.numeroCuota),
      String(c.importe),
      isoDate(c.fechaVencimiento),
      c.estado,
      isoDate(c.fechaPagoEfectivo),
      c.medioPago ?? '',
      c.poliza?.numeroPoliza ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── siniestros ──────────────────────────────────────────────────────────

  async exportSiniestros(): Promise<string> {
    const rows = await this.siniestroRepo.find({
      relations: ['asegurado', 'bien', 'productor', 'compania'],
      order: { fechaOcurrencia: 'DESC' },
    });

    const headers = [
      'id', 'tipo', 'fecha_ocurrencia', 'hora_ocurrencia',
      'lugar_ocurrencia', 'relato', 'datos_terceros', 'estado',
      'numero_denuncia_compania', 'asegurado_dni_cuil',
      'bien_patente', 'bien_id', 'productor_dni_cuil', 'compania_nombre',
    ];

    const data = rows.map((s) => [
      s.id,
      s.tipo,
      isoDate(s.fechaOcurrencia),
      s.horaOcurrencia ?? '',
      s.lugarOcurrencia ?? '',
      s.relato ?? '',
      s.datosTerceros ?? '',
      s.estado,
      s.numeroDenunciaCompania ?? '',
      s.asegurado?.dniCuil ?? '',
      s.bien?.patente ?? '',
      s.bien?.id ?? '',
      s.productor?.dniCuil ?? '',
      s.compania?.nombre ?? '',
    ]);

    return toCsv(headers, data);
  }

  // ── reclamos ────────────────────────────────────────────────────────────

  async exportReclamos(): Promise<string> {
    const rows = await this.reclamoRepo.find({
      relations: ['asegurado', 'productor', 'compania'],
      order: { fechaApertura: 'DESC' },
    });

    const headers = [
      'id', 'tipo', 'descripcion', 'estado', 'fecha_apertura',
      'asegurado_dni_cuil', 'productor_dni_cuil', 'compania_nombre',
    ];

    const data = rows.map((r) => [
      r.id,
      r.tipo,
      r.descripcion ?? '',
      r.estado,
      isoDate(r.fechaApertura),
      r.asegurado?.dniCuil ?? '',
      r.productor?.dniCuil ?? '',
      r.compania?.nombre ?? '',
    ]);

    return toCsv(headers, data);
  }
}
