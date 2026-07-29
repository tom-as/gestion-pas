import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Siniestro } from '../database/entities/siniestro.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Productor } from '../database/entities/productor.entity';
import { Usuario } from '../database/entities/usuario.entity';
import {
  EstadoCuota,
  EstadoPoliza,
  EstadoReclamo,
  EstadoSiniestro,
  TipoBien,
  TipoReclamo,
  UserRole,
} from '@gestion-pas/types';

// ── helpers internos ──────────────────────────────────────

/** Devuelve la fecha de hoy como string 'YYYY-MM-DD'.
 *  Necesario para comparar contra columnas `date` de PG sin componente horario.
 */
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Devuelve un objeto Date de hoy a medianoche — usado para calcular rangos relativos con setDate(). */
function hoyMedianoche(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(BienAsegurado)
    private readonly bienRepo: Repository<BienAsegurado>,
    @InjectRepository(Poliza)
    private readonly polizaRepo: Repository<Poliza>,
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(Siniestro)
    private readonly siniestroRepo: Repository<Siniestro>,
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
  ) {}

  /** R1 — Cartera de asegurados con productor asignado */
  async carteraAsegurados(usuario: Usuario) {
    const asegurados = await this.aseguradoRepo.find({
      relations: ['productor'],
      order: { nombre: 'ASC' },
    });

    const lista = usuario.perfil === UserRole.PRODUCTOR
      ? asegurados.filter((a) => a.productor?.id === usuario.productor?.id)
      : asegurados;

    return {
      total: lista.length,
      asegurados: lista.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        dniCuil: a.dniCuil,
        email: a.email,
        telefono: a.telefono,
        productor: a.productor
          ? { id: a.productor.id, nombre: a.productor.nombre }
          : null,
      })),
    };
  }

  /** R2 — Cuotas con vencimiento en los próximos N días (solo pendientes) */
  async vencimientosProximos(dias: number, usuario: Usuario) {
    // Usar strings ISO para columnas `date` de PG (sin componente horario)
    const hoyStr = hoyISO();
    const limiteStr = (() => {
      const d = hoyMedianoche();
      d.setDate(d.getDate() + dias);
      return d.toISOString().slice(0, 10);
    })();

    // Primero marcar pólizas vencidas para que sus cuotas no aparezcan
    await this.suspenderPolizasVencidas();

    const cuotas = await this.cuotaRepo.find({
      where: {
        fechaVencimiento: Between(hoyStr, limiteStr) as unknown as Date,
        estado: EstadoCuota.PENDIENTE,
      },
      relations: ['poliza', 'poliza.asegurado', 'poliza.productor', 'poliza.compania'],
      order: { fechaVencimiento: 'ASC' },
    });

    const lista = usuario.perfil === UserRole.PRODUCTOR
      ? cuotas.filter((c) => c.poliza?.productor?.id === usuario.productor?.id)
      : cuotas;

    return {
      diasHorizonte: dias,
      total: lista.length,
      cuotas: lista.map((c) => ({
        id: c.id,
        numeroCuota: c.numeroCuota,
        importe: c.importe,
        fechaVencimiento: c.fechaVencimiento,
        estado: c.estado,
        poliza: {
          id: c.poliza.id,
          numeroPoliza: c.poliza.numeroPoliza,
          asegurado: c.poliza.asegurado?.nombre,
          productor: c.poliza.productor?.nombre,
          compania: c.poliza.compania?.nombre,
        },
      })),
    };
  }

  /** R3 — Siniestros agrupados por estado */
  async siniestros(estado: EstadoSiniestro | undefined, usuario: Usuario) {
    const where = estado ? { estado } : {};
    const todos = await this.siniestroRepo.find({
      where,
      relations: ['asegurado', 'productor', 'compania'],
      order: { fechaOcurrencia: 'DESC' },
    });

    const lista = usuario.perfil === UserRole.PRODUCTOR
      ? todos.filter((s) => s.productor?.id === usuario.productor?.id)
      : todos;

    const porEstado = Object.values(EstadoSiniestro).reduce<Record<string, number>>(
      (acc, e) => ({ ...acc, [e]: lista.filter((s) => s.estado === e).length }),
      {},
    );

    return { total: lista.length, porEstado, siniestros: lista };
  }

  /** R4 — Reclamos con filtros por estado / tipo / compañía */
  async reclamos(
    estado: EstadoReclamo | undefined,
    tipo: TipoReclamo | undefined,
    companiaId: string | undefined,
    usuario: Usuario,
  ) {
    const where: Record<string, unknown> = {};
    if (estado) where['estado'] = estado;
    if (tipo) where['tipo'] = tipo;
    if (companiaId) where['compania'] = { id: companiaId };

    const todos = await this.reclamoRepo.find({
      where,
      relations: ['asegurado', 'productor', 'compania'],
      order: { fechaApertura: 'DESC' },
    });

    const lista = usuario.perfil === UserRole.PRODUCTOR
      ? todos.filter((r) => r.productor?.id === usuario.productor?.id)
      : todos;

    const porEstado = Object.values(EstadoReclamo).reduce<Record<string, number>>(
      (acc, e) => ({ ...acc, [e]: lista.filter((r) => r.estado === e).length }),
      {},
    );

    return { total: lista.length, porEstado, reclamos: lista };
  }

  /** R5 — Pólizas por estado / próximas a vencer */
  async polizas(estado: EstadoPoliza | undefined, vencenEnDias: number | undefined, usuario: Usuario) {
    // Sincronizar estados antes de leer
    await this.suspenderPolizasVencidas();

    const where: Record<string, unknown> = {};
    if (estado) where['estado'] = estado;

    if (vencenEnDias !== undefined) {
      // Strings ISO para columna `date` de PG
      const hoyStr = hoyISO();
      const limiteStr = (() => {
        const d = hoyMedianoche();
        d.setDate(d.getDate() + vencenEnDias);
        return d.toISOString().slice(0, 10);
      })();
      where['vigenciaFin'] = Between(hoyStr, limiteStr);
    }

    const todas = await this.polizaRepo.find({
      where,
      relations: ['asegurado', 'productor', 'compania'],
      order: { vigenciaFin: 'ASC' },
    });

    const lista = usuario.perfil === UserRole.PRODUCTOR
      ? todas.filter((p) => p.productor?.id === usuario.productor?.id)
      : todas;

    const porEstado = Object.values(EstadoPoliza).reduce<Record<string, number>>(
      (acc, e) => ({ ...acc, [e]: lista.filter((p) => p.estado === e).length }),
      {},
    );

    return { total: lista.length, porEstado, polizas: lista };
  }

  /** R6 — Comisiones estimadas por productor (pólizas activas × importe cuota vigente) */
  async comisiones(usuario: Usuario) {
    const productores = await this.productorRepo.find({
      relations: ['polizas', 'polizas.compania'],
      order: { nombre: 'ASC' },
    });

    const lista = usuario.perfil === UserRole.PRODUCTOR
      ? productores.filter((p) => p.id === usuario.productor?.id)
      : productores;

    return {
      total: lista.length,
      productores: lista.map((p) => {
        const activas = p.polizas?.filter((pol) => pol.estado === EstadoPoliza.ACTIVA) ?? [];
        const totalCuotasMes = activas.reduce(
          (sum, pol) => sum + Number(pol.importeCuotaVigente),
          0,
        );
        return {
          id: p.id,
          nombre: p.nombre,
          email: p.email,
          estado: p.estado,
          polizasActivas: activas.length,
          totalImporteCuotasMes: totalCuotasMes,
        };
      }),
    };
  }

  /** Marca como SUSPENDIDA cualquier póliza ACTIVA con vigenciaFin pasada.
   *  Usa string ISO 'YYYY-MM-DD' para comparar correctamente contra la columna `date` de PG.
   */
  private async suspenderPolizasVencidas(): Promise<void> {
    const hoy = hoyISO();
    await this.polizaRepo.update(
      { estado: EstadoPoliza.ACTIVA, vigenciaFin: LessThan(hoy) as unknown as Date },
      { estado: EstadoPoliza.SUSPENDIDA },
    );
  }

  /** R7 — Bienes con campos clave incompletos (calidad de datos) */
  async datosIncompletos(usuario: Usuario) {
    const bienes = await this.bienRepo.find({
      relations: ['asegurado', 'asegurado.productor'],
      order: { tipo: 'ASC' },
    });

    const filtrados = usuario.perfil === UserRole.PRODUCTOR
      ? bienes.filter((b) => b.asegurado?.productor?.id === usuario.productor?.id)
      : bienes;

    const incompletos = filtrados.filter((b) => {
      if (b.tipo === TipoBien.AUTOMOTOR) {
        return !b.patente || !b.marca || !b.modelo || !b.anioFabricacion || b.sumaAsegurada === null;
      }
      return b.sumaAsegurada === null;
    });

    return {
      total: incompletos.length,
      bienes: incompletos.map((b) => ({
        id: b.id,
        tipo: b.tipo,
        asegurado: b.asegurado
          ? { id: b.asegurado.id, nombre: b.asegurado.nombre }
          : null,
        camposFaltantes: this.camposFaltantes(b),
      })),
    };
  }

  private camposFaltantes(b: BienAsegurado): string[] {
    const faltantes: string[] = [];
    if (b.sumaAsegurada === null) faltantes.push('sumaAsegurada');
    if (b.tipo === TipoBien.AUTOMOTOR) {
      if (!b.patente) faltantes.push('patente');
      if (!b.marca) faltantes.push('marca');
      if (!b.modelo) faltantes.push('modelo');
      if (!b.anioFabricacion) faltantes.push('anioFabricacion');
    }
    return faltantes;
  }
}
