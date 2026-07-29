import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Poliza } from '../database/entities/poliza.entity';
import { Endoso } from '../database/entities/endoso.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { EstadoPoliza, UserRole } from '@gestion-pas/types';
import { CreatePolizaDto, UpdatePolizaDto, CreateEndosoDto } from './dto/poliza.dto';

@Injectable()
export class PolizasService {
  constructor(
    @InjectRepository(Poliza)
    private readonly polizaRepo: Repository<Poliza>,
    @InjectRepository(Endoso)
    private readonly endosoRepo: Repository<Endoso>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(BienAsegurado)
    private readonly bienRepo: Repository<BienAsegurado>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,
  ) {}

  async findAll(usuario: Usuario): Promise<Poliza[]> {
    await this.suspenderVencidas();
    const polizas = await this.polizaRepo.find({
      relations: ['asegurado', 'bien', 'productor', 'compania'],
      order: { vigenciaFin: 'DESC' },
    });

    if (usuario.perfil === UserRole.PRODUCTOR) {
      return polizas.filter((p) => p.productor?.id === usuario.productor?.id);
    }
    return polizas;
  }

  async findOne(id: string, usuario: Usuario): Promise<Poliza> {
    const poliza = await this.polizaRepo.findOne({
      where: { id },
      relations: ['asegurado', 'bien', 'productor', 'compania'],
    });
    if (!poliza) throw new NotFoundException(`Póliza ${id} no encontrada`);
    this.checkAccess(poliza, usuario);
    return poliza;
  }

  async create(dto: CreatePolizaDto, usuario: Usuario): Promise<Poliza> {
    const asegurado = await this.aseguradoRepo.findOne({ where: { id: dto.aseguradoId } });
    if (!asegurado) throw new NotFoundException(`Asegurado ${dto.aseguradoId} no encontrado`);

    const bien = await this.bienRepo.findOne({ where: { id: dto.bienId } });
    if (!bien) throw new NotFoundException(`Bien ${dto.bienId} no encontrado`);

    const productor = await this.productorRepo.findOne({ where: { id: dto.productorId } });
    if (!productor) throw new NotFoundException(`Productor ${dto.productorId} no encontrado`);

    // El productor solo puede crear pólizas en su propia cartera
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      usuario.productor?.id !== dto.productorId
    ) {
      throw new ForbiddenException('Solo podés crear pólizas para tu propia cartera');
    }

    const compania = await this.companiaRepo.findOne({ where: { id: dto.companiaId } });
    if (!compania) throw new NotFoundException(`Compañía ${dto.companiaId} no encontrada`);

    const poliza = this.polizaRepo.create({
      numeroPoliza: dto.numeroPoliza,
      vigenciaInicio: new Date(dto.vigenciaInicio),
      vigenciaFin: new Date(dto.vigenciaFin),
      importeCuotaVigente: dto.importeCuotaVigente,
      modalidadPago: dto.modalidadPago ?? null,
      estado: dto.estado,
      periodicidadRefacturacion: dto.periodicidadRefacturacion ?? null,
      asegurado,
      bien,
      productor,
      compania,
    });
    return this.polizaRepo.save(poliza);
  }

  async update(id: string, dto: UpdatePolizaDto, usuario: Usuario): Promise<Poliza> {
    const poliza = await this.findOne(id, usuario);

    Object.assign(poliza, {
      estado: dto.estado ?? poliza.estado,
      importeCuotaVigente: dto.importeCuotaVigente ?? poliza.importeCuotaVigente,
      modalidadPago: dto.modalidadPago ?? poliza.modalidadPago,
      periodicidadRefacturacion: dto.periodicidadRefacturacion ?? poliza.periodicidadRefacturacion,
    });
    return this.polizaRepo.save(poliza);
  }

  async createEndoso(polizaId: string, dto: CreateEndosoDto, usuario: Usuario): Promise<Endoso> {
    const poliza = await this.findOne(polizaId, usuario);

    const endoso = this.endosoRepo.create({
      numeroEndoso: dto.numeroEndoso,
      tipoModificacion: dto.tipoModificacion,
      fechaEmision: new Date(dto.fechaEmision),
      importeActualizado: dto.importeActualizado ?? null,
      sumaAseguradaActualizada: dto.sumaAseguradaActualizada ?? null,
      poliza,
    });
    return this.endosoRepo.save(endoso);
  }

  async findEndosos(polizaId: string, usuario: Usuario): Promise<Endoso[]> {
    // Verificar acceso a la póliza
    await this.findOne(polizaId, usuario);

    return this.endosoRepo.find({
      where: { poliza: { id: polizaId } },
      order: { fechaEmision: 'DESC' },
    });
  }

  /**
   * Marca como SUSPENDIDA cualquier póliza ACTIVA cuya vigenciaFin < hoy.
   * Se llama antes de lecturas para mantener consistencia sin necesitar un cron.
   */
  private async suspenderVencidas(): Promise<void> {
    // Columna `date` en PG no tiene hora — comparar como string YYYY-MM-DD
    const hoy = new Date().toISOString().slice(0, 10); // '2025-07-28'
    await this.polizaRepo.update(
      { estado: EstadoPoliza.ACTIVA, vigenciaFin: LessThan(hoy) as unknown as Date },
      { estado: EstadoPoliza.SUSPENDIDA },
    );
  }

  private checkAccess(poliza: Poliza, usuario: Usuario): void {
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      poliza.productor?.id !== usuario.productor?.id
    ) {
      throw new ForbiddenException('Esta póliza no pertenece a tu cartera');
    }
    if (
      usuario.perfil === UserRole.ASEGURADO &&
      poliza.asegurado?.id !== usuario.asegurado?.id
    ) {
      throw new ForbiddenException('Esta póliza no pertenece a tu información');
    }
  }
}
