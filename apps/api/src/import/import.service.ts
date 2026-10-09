import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Endoso } from '../database/entities/endoso.entity';
import { Organizador } from '../database/entities/organizador.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Productor } from '../database/entities/productor.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Siniestro } from '../database/entities/siniestro.entity';
import { Usuario } from '../database/entities/usuario.entity';
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

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportResult {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

// ─────────────────────────────────────────────────────────────────────────────
// Parser RFC 4180
// ─────────────────────────────────────────────────────────────────────────────

function parseCsv(buffer: Buffer): ParsedCsv {
  // Strip UTF-8 BOM si existe
  let raw = buffer.toString('utf-8');
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);

  const lines = splitCsvLines(raw);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    // Ignorar filas completamente vacías
    if (row.every((c) => c === '')) continue;
    rows.push(row);
  }
  return { headers, rows };
}

/**
 * Divide el CSV en líneas respetando celdas entre comillas que pueden contener \n.
 */
function splitCsvLines(raw: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current !== '') lines.push(current);
  return lines;
}

/** Parsea una línea CSV en un array de celdas (sin comillas externas, con comillas internas unescapadas). */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) {
      cells.push('');
      break;
    }
    if (line[i] === '"') {
      // Celda entre comillas
      let cell = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          cell += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          cell += line[i++];
        }
      }
      cells.push(cell);
      if (line[i] === ',') i++;
    } else {
      const end = line.indexOf(',', i);
      if (end === -1) {
        cells.push(line.slice(i));
        break;
      }
      cells.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return cells;
}

/** Crea un mapa header→índice para acceder por nombre de columna. */
function colMap(headers: string[]): Record<string, number> {
  return Object.fromEntries(headers.map((h, i) => [h, i]));
}

/** Obtiene una celda por nombre de columna; devuelve '' si no existe. */
function col(row: string[], map: Record<string, number>, name: string): string {
  const idx = map[name];
  return idx !== undefined ? (row[idx] ?? '') : '';
}

/** Convierte '' → null, o devuelve el string. */
function nullableStr(v: string): string | null {
  return v === '' ? null : v;
}

/** Convierte '' → null, o parsea como número. */
function nullableNum(v: string): number | null {
  if (v === '') return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/** Convierte '' → null, o devuelve el string como Date-compatible string. */
function nullableDate(v: string): Date | null {
  if (v === '') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Convierte 'true'/'false'/'' → boolean | null. */
function nullableBool(v: string): boolean | null {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ImportService {
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

    @InjectRepository(Organizador)
    private readonly organizadorRepo: Repository<Organizador>,

    @InjectRepository(Poliza)
    private readonly polizaRepo: Repository<Poliza>,

    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,

    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,

    @InjectRepository(Siniestro)
    private readonly siniestroRepo: Repository<Siniestro>,
  ) {}

  // ── 1. Compañías ──────────────────────────────────────────────────────────

  async importCompanias(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // 1-based, +1 for header
      const row = rows[i];
      const nombre = col(row, m, 'nombre');
      if (!nombre) {
        result.errors.push({ row: rowNum, message: 'Campo "nombre" requerido' });
        continue;
      }
      const existing = await this.companiaRepo.findOne({ where: { nombre } });
      if (existing) { result.skipped++; continue; }

      const periodicidad = col(row, m, 'periodicidad_refacturacion');
      await this.companiaRepo.save(this.companiaRepo.create({
        nombre,
        periodoDGraciaDias: nullableNum(col(row, m, 'periodo_gracia_dias')) ?? undefined,
        periodicidadRefacturacion: (periodicidad as PeriodicidadRefacturacion) || null,
        mecanismoNotificacion: nullableStr(col(row, m, 'mecanismo_notificacion')),
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 2. Productores ────────────────────────────────────────────────────────

  async importProductores(buffer: Buffer, usuario: Usuario): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    const organizador = await this.organizadorRepo.findOne({
      where: { id: usuario.organizador!.id },
    });
    if (!organizador) {
      result.errors.push({ row: 0, message: 'Organizador no encontrado para el usuario autenticado' });
      return result;
    }

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const dniCuil = col(row, m, 'dni_cuil');
      const nombre = col(row, m, 'nombre');
      if (!dniCuil || !nombre) {
        result.errors.push({ row: rowNum, message: 'Campos "nombre" y "dni_cuil" requeridos' });
        continue;
      }
      const existing = await this.productorRepo.findOne({ where: { dniCuil } });
      if (existing) { result.skipped++; continue; }

      const estadoVal = col(row, m, 'estado');
      await this.productorRepo.save(this.productorRepo.create({
        nombre,
        dniCuil,
        telefono: nullableStr(col(row, m, 'telefono')),
        email: nullableStr(col(row, m, 'email')),
        fechaIncorporacion: nullableDate(col(row, m, 'fecha_incorporacion')),
        companiasOpera: nullableStr(col(row, m, 'companias_opera')),
        estado: (estadoVal as EstadoProductor) || EstadoProductor.ACTIVO,
        organizador,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 3. Asegurados ─────────────────────────────────────────────────────────

  async importAsegurados(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const dniCuil = col(row, m, 'dni_cuil');
      const nombre = col(row, m, 'nombre');
      const productorDni = col(row, m, 'productor_dni_cuil');
      if (!dniCuil || !nombre) {
        result.errors.push({ row: rowNum, message: 'Campos "nombre" y "dni_cuil" requeridos' });
        continue;
      }
      const existing = await this.aseguradoRepo.findOne({ where: { dniCuil } });
      if (existing) { result.skipped++; continue; }

      const productor = productorDni
        ? await this.productorRepo.findOne({ where: { dniCuil: productorDni } })
        : null;
      if (!productor) {
        result.errors.push({ row: rowNum, message: `Productor con dni_cuil "${productorDni}" no encontrado` });
        continue;
      }

      await this.aseguradoRepo.save(this.aseguradoRepo.create({
        nombre,
        dniCuil,
        fechaNacimiento: nullableDate(col(row, m, 'fecha_nacimiento')),
        direccion: nullableStr(col(row, m, 'direccion')),
        codigoPostal: nullableStr(col(row, m, 'codigo_postal')),
        telefono: nullableStr(col(row, m, 'telefono')),
        email: nullableStr(col(row, m, 'email')),
        productor,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 4. Bienes ─────────────────────────────────────────────────────────────

  async importBienes(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const idVal = col(row, m, 'id');
      const tipoVal = col(row, m, 'tipo');
      const aseguradoDni = col(row, m, 'asegurado_dni_cuil');

      if (!tipoVal || !aseguradoDni) {
        result.errors.push({ row: rowNum, message: 'Campos "tipo" y "asegurado_dni_cuil" requeridos' });
        continue;
      }

      // Los bienes no tienen una clave única de negocio clara aparte del UUID.
      // Si el CSV incluye el id original, usarlo para detectar duplicado.
      if (idVal) {
        const existing = await this.bienRepo.findOne({ where: { id: idVal } });
        if (existing) { result.skipped++; continue; }
      }

      const asegurado = await this.aseguradoRepo.findOne({ where: { dniCuil: aseguradoDni } });
      if (!asegurado) {
        result.errors.push({ row: rowNum, message: `Asegurado con dni_cuil "${aseguradoDni}" no encontrado` });
        continue;
      }

      const anioVal = col(row, m, 'anio_fabricacion');
      await this.bienRepo.save(this.bienRepo.create({
        tipo: tipoVal as TipoBien,
        sumaAsegurada: nullableNum(col(row, m, 'suma_asegurada')),
        patente: nullableStr(col(row, m, 'patente')),
        marca: nullableStr(col(row, m, 'marca')),
        modelo: nullableStr(col(row, m, 'modelo')),
        version: nullableStr(col(row, m, 'version')),
        anioFabricacion: anioVal ? parseInt(anioVal, 10) : null,
        uso: (col(row, m, 'uso') as UsoVehiculo) || null,
        tieneGnc: nullableBool(col(row, m, 'tiene_gnc')),
        accesoriosDeclarados: nullableStr(col(row, m, 'accesorios_declarados')),
        asegurado,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 5. Pólizas ────────────────────────────────────────────────────────────

  async importPolizas(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const numeroPoliza = col(row, m, 'numero_poliza');
      const aseguradoDni = col(row, m, 'asegurado_dni_cuil');
      const productorDni = col(row, m, 'productor_dni_cuil');
      const companiaNombre = col(row, m, 'compania_nombre');
      const bienPatente = col(row, m, 'bien_patente');
      const bienId = col(row, m, 'bien_id');

      if (!numeroPoliza || !aseguradoDni || !productorDni || !companiaNombre) {
        result.errors.push({ row: rowNum, message: 'Campos numero_poliza, asegurado_dni_cuil, productor_dni_cuil y compania_nombre son requeridos' });
        continue;
      }

      const existing = await this.polizaRepo.findOne({ where: { numeroPoliza } });
      if (existing) { result.skipped++; continue; }

      const asegurado = await this.aseguradoRepo.findOne({ where: { dniCuil: aseguradoDni } });
      if (!asegurado) { result.errors.push({ row: rowNum, message: `Asegurado "${aseguradoDni}" no encontrado` }); continue; }

      const productor = await this.productorRepo.findOne({ where: { dniCuil: productorDni } });
      if (!productor) { result.errors.push({ row: rowNum, message: `Productor "${productorDni}" no encontrado` }); continue; }

      const compania = await this.companiaRepo.findOne({ where: { nombre: companiaNombre } });
      if (!compania) { result.errors.push({ row: rowNum, message: `Compañía "${companiaNombre}" no encontrada` }); continue; }

      // Resolver bien: primero por patente, luego por id
      let bien: BienAsegurado | null = null;
      if (bienPatente) {
        bien = await this.bienRepo.findOne({ where: { patente: bienPatente } });
      }
      if (!bien && bienId) {
        bien = await this.bienRepo.findOne({ where: { id: bienId } });
      }
      if (!bien) { result.errors.push({ row: rowNum, message: `Bien (patente="${bienPatente}" / id="${bienId}") no encontrado` }); continue; }

      const vigenciaInicio = col(row, m, 'vigencia_inicio');
      const vigenciaFin = col(row, m, 'vigencia_fin');
      const importeVal = col(row, m, 'importe_cuota_vigente');
      const estadoVal = col(row, m, 'estado');
      const periodicidad = col(row, m, 'periodicidad_refacturacion');

      await this.polizaRepo.save(this.polizaRepo.create({
        numeroPoliza,
        vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : new Date(),
        vigenciaFin: vigenciaFin ? new Date(vigenciaFin) : new Date(),
        importeCuotaVigente: importeVal ? Number(importeVal) : 0,
        modalidadPago: nullableStr(col(row, m, 'modalidad_pago')),
        estado: (estadoVal as EstadoPoliza) || EstadoPoliza.ACTIVA,
        periodicidadRefacturacion: (periodicidad as PeriodicidadRefacturacion) || null,
        asegurado,
        bien,
        productor,
        compania,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 6. Endosos ────────────────────────────────────────────────────────────

  async importEndosos(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const idVal = col(row, m, 'id');
      const numeroEndoso = col(row, m, 'numero_endoso');
      const polizaNumero = col(row, m, 'poliza_numero');

      if (!numeroEndoso || !polizaNumero) {
        result.errors.push({ row: rowNum, message: 'Campos "numero_endoso" y "poliza_numero" requeridos' });
        continue;
      }

      if (idVal) {
        const existing = await this.endosoRepo.findOne({ where: { id: idVal } });
        if (existing) { result.skipped++; continue; }
      }

      const poliza = await this.polizaRepo.findOne({ where: { numeroPoliza: polizaNumero } });
      if (!poliza) { result.errors.push({ row: rowNum, message: `Póliza "${polizaNumero}" no encontrada` }); continue; }

      const fechaEmision = col(row, m, 'fecha_emision');
      await this.endosoRepo.save(this.endosoRepo.create({
        numeroEndoso,
        tipoModificacion: col(row, m, 'tipo_modificacion') || 'Sin descripción',
        fechaEmision: fechaEmision ? new Date(fechaEmision) : new Date(),
        importeActualizado: nullableNum(col(row, m, 'importe_actualizado')),
        sumaAseguradaActualizada: nullableNum(col(row, m, 'suma_asegurada_actualizada')),
        poliza,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 7. Cuotas ─────────────────────────────────────────────────────────────

  async importCuotas(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const idVal = col(row, m, 'id');
      const polizaNumero = col(row, m, 'poliza_numero');
      const numeroCuotaStr = col(row, m, 'numero_cuota');

      if (!polizaNumero || !numeroCuotaStr) {
        result.errors.push({ row: rowNum, message: 'Campos "poliza_numero" y "numero_cuota" requeridos' });
        continue;
      }

      if (idVal) {
        const existing = await this.cuotaRepo.findOne({ where: { id: idVal } });
        if (existing) { result.skipped++; continue; }
      }

      const poliza = await this.polizaRepo.findOne({ where: { numeroPoliza: polizaNumero } });
      if (!poliza) { result.errors.push({ row: rowNum, message: `Póliza "${polizaNumero}" no encontrada` }); continue; }

      const fechaVencimiento = col(row, m, 'fecha_vencimiento');
      const estadoVal = col(row, m, 'estado');
      const importeVal = col(row, m, 'importe');

      await this.cuotaRepo.save(this.cuotaRepo.create({
        numeroCuota: parseInt(numeroCuotaStr, 10),
        importe: importeVal ? Number(importeVal) : 0,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : new Date(),
        estado: (estadoVal as EstadoCuota) || EstadoCuota.PENDIENTE,
        fechaPagoEfectivo: nullableDate(col(row, m, 'fecha_pago_efectivo')),
        medioPago: nullableStr(col(row, m, 'medio_pago')),
        poliza,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 8. Siniestros ─────────────────────────────────────────────────────────

  async importSiniestros(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const idVal = col(row, m, 'id');
      const tipoVal = col(row, m, 'tipo');
      const aseguradoDni = col(row, m, 'asegurado_dni_cuil');
      const productorDni = col(row, m, 'productor_dni_cuil');
      const companiaNombre = col(row, m, 'compania_nombre');
      const bienPatente = col(row, m, 'bien_patente');
      const bienId = col(row, m, 'bien_id');

      if (!tipoVal || !aseguradoDni || !productorDni || !companiaNombre) {
        result.errors.push({ row: rowNum, message: 'Campos tipo, asegurado_dni_cuil, productor_dni_cuil y compania_nombre son requeridos' });
        continue;
      }

      if (idVal) {
        const existing = await this.siniestroRepo.findOne({ where: { id: idVal } });
        if (existing) { result.skipped++; continue; }
      }

      const asegurado = await this.aseguradoRepo.findOne({ where: { dniCuil: aseguradoDni } });
      if (!asegurado) { result.errors.push({ row: rowNum, message: `Asegurado "${aseguradoDni}" no encontrado` }); continue; }

      const productor = await this.productorRepo.findOne({ where: { dniCuil: productorDni } });
      if (!productor) { result.errors.push({ row: rowNum, message: `Productor "${productorDni}" no encontrado` }); continue; }

      const compania = await this.companiaRepo.findOne({ where: { nombre: companiaNombre } });
      if (!compania) { result.errors.push({ row: rowNum, message: `Compañía "${companiaNombre}" no encontrada` }); continue; }

      let bien: BienAsegurado | null = null;
      if (bienPatente) bien = await this.bienRepo.findOne({ where: { patente: bienPatente } });
      if (!bien && bienId) bien = await this.bienRepo.findOne({ where: { id: bienId } });
      if (!bien) { result.errors.push({ row: rowNum, message: `Bien (patente="${bienPatente}" / id="${bienId}") no encontrado` }); continue; }

      const fechaOcurrencia = col(row, m, 'fecha_ocurrencia');
      const estadoVal = col(row, m, 'estado');

      await this.siniestroRepo.save(this.siniestroRepo.create({
        tipo: tipoVal as TipoSiniestro,
        fechaOcurrencia: fechaOcurrencia ? new Date(fechaOcurrencia) : new Date(),
        horaOcurrencia: nullableStr(col(row, m, 'hora_ocurrencia')),
        lugarOcurrencia: nullableStr(col(row, m, 'lugar_ocurrencia')),
        relato: nullableStr(col(row, m, 'relato')),
        datosTerceros: nullableStr(col(row, m, 'datos_terceros')),
        estado: (estadoVal as EstadoSiniestro) || EstadoSiniestro.ABIERTO,
        numeroDenunciaCompania: nullableStr(col(row, m, 'numero_denuncia_compania')),
        asegurado,
        bien,
        productor,
        compania,
      }));
      result.inserted++;
    }
    return result;
  }

  // ── 9. Reclamos ───────────────────────────────────────────────────────────

  async importReclamos(buffer: Buffer): Promise<ImportResult> {
    const { headers, rows } = parseCsv(buffer);
    const m = colMap(headers);
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const row = rows[i];
      const idVal = col(row, m, 'id');
      const tipoVal = col(row, m, 'tipo');
      const aseguradoDni = col(row, m, 'asegurado_dni_cuil');
      const productorDni = col(row, m, 'productor_dni_cuil');

      if (!tipoVal || !aseguradoDni || !productorDni) {
        result.errors.push({ row: rowNum, message: 'Campos tipo, asegurado_dni_cuil y productor_dni_cuil son requeridos' });
        continue;
      }

      if (idVal) {
        const existing = await this.reclamoRepo.findOne({ where: { id: idVal } });
        if (existing) { result.skipped++; continue; }
      }

      const asegurado = await this.aseguradoRepo.findOne({ where: { dniCuil: aseguradoDni } });
      if (!asegurado) { result.errors.push({ row: rowNum, message: `Asegurado "${aseguradoDni}" no encontrado` }); continue; }

      const productor = await this.productorRepo.findOne({ where: { dniCuil: productorDni } });
      if (!productor) { result.errors.push({ row: rowNum, message: `Productor "${productorDni}" no encontrado` }); continue; }

      let compania: CompaniaAseguradora | null = null;
      const companiaNombre = col(row, m, 'compania_nombre');
      if (companiaNombre) {
        compania = await this.companiaRepo.findOne({ where: { nombre: companiaNombre } });
        if (!compania) { result.errors.push({ row: rowNum, message: `Compañía "${companiaNombre}" no encontrada` }); continue; }
      }

      const fechaApertura = col(row, m, 'fecha_apertura');
      const estadoVal = col(row, m, 'estado');

      await this.reclamoRepo.save(this.reclamoRepo.create({
        tipo: tipoVal as TipoReclamo,
        descripcion: nullableStr(col(row, m, 'descripcion')),
        estado: (estadoVal as EstadoReclamo) || EstadoReclamo.ABIERTO,
        fechaApertura: fechaApertura ? new Date(fechaApertura) : new Date(),
        asegurado,
        productor,
        compania,
      }));
      result.inserted++;
    }
    return result;
  }
}
