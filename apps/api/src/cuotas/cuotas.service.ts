import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Cuota } from '../database/entities/cuota.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { EstadoCuota, UserRole } from '@gestion-pas/types';
import { CreateCuotaDto, UpdateCuotaDto } from './dto/cuota.dto';

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(Poliza)
    private readonly polizaRepo: Repository<Poliza>,
  ) {}

  async findOne(id: string, usuario: Usuario): Promise<Cuota> {
    const cuota = await this.cuotaRepo.findOne({
      where: { id },
      relations: ['poliza', 'poliza.productor'],
    });
    if (!cuota) throw new NotFoundException(`Cuota ${id} no encontrada`);
    this.checkPolizaAccess(cuota.poliza, usuario);
    return cuota;
  }

  async findByPoliza(polizaId: string, usuario: Usuario): Promise<Cuota[]> {
    const poliza = await this.loadPoliza(polizaId);
    this.checkPolizaAccess(poliza, usuario);

    return this.cuotaRepo.find({
      where: { poliza: { id: polizaId } },
      order: { numeroCuota: 'ASC' },
    });
  }

  async create(dto: CreateCuotaDto, usuario: Usuario): Promise<Cuota> {
    const poliza = await this.loadPoliza(dto.polizaId);
    this.checkPolizaAccess(poliza, usuario);

    const cuota = this.cuotaRepo.create({
      numeroCuota: dto.numeroCuota,
      importe: dto.importe,
      fechaVencimiento: new Date(dto.fechaVencimiento),
      estado: dto.estado,
      poliza,
    });
    return this.cuotaRepo.save(cuota);
  }

  async update(id: string, dto: UpdateCuotaDto, usuario: Usuario): Promise<Cuota> {
    const cuota = await this.cuotaRepo.findOne({
      where: { id },
      relations: ['poliza', 'poliza.productor'],
    });
    if (!cuota) throw new NotFoundException(`Cuota ${id} no encontrada`);
    this.checkPolizaAccess(cuota.poliza, usuario);

    Object.assign(cuota, {
      estado: dto.estado ?? cuota.estado,
      fechaPagoEfectivo: dto.fechaPagoEfectivo ? new Date(dto.fechaPagoEfectivo) : cuota.fechaPagoEfectivo,
      medioPago: dto.medioPago ?? cuota.medioPago,
    });
    return this.cuotaRepo.save(cuota);
  }

  async findVencimientosProximos(dias: number, usuario: Usuario): Promise<Cuota[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + dias);

    const cuotas = await this.cuotaRepo.find({
      where: {
        fechaVencimiento: Between(hoy, limite),
        estado: EstadoCuota.PENDIENTE,
      },
      relations: ['poliza', 'poliza.asegurado', 'poliza.productor', 'poliza.compania'],
      order: { fechaVencimiento: 'ASC' },
    });

    if (usuario.perfil === UserRole.PRODUCTOR) {
      return cuotas.filter((c) => c.poliza?.productor?.id === usuario.productor?.id);
    }
    return cuotas;
  }

  private async loadPoliza(polizaId: string): Promise<Poliza> {
    const poliza = await this.polizaRepo.findOne({
      where: { id: polizaId },
      relations: ['productor'],
    });
    if (!poliza) throw new NotFoundException(`Póliza ${polizaId} no encontrada`);
    return poliza;
  }

  private checkPolizaAccess(poliza: Poliza, usuario: Usuario): void {
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      poliza.productor?.id !== usuario.productor?.id
    ) {
      throw new ForbiddenException('Esta póliza no pertenece a tu cartera');
    }
  }
}
