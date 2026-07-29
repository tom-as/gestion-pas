import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { UserRole } from '@gestion-pas/types';
import { CreateReclamoDto, UpdateReclamoEstadoDto } from './dto/reclamo.dto';

@Injectable()
export class ReclamosService {
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,
  ) {}

  async findAll(usuario: Usuario): Promise<Reclamo[]> {
    const reclamos = await this.reclamoRepo.find({
      relations: ['asegurado', 'productor', 'compania'],
      order: { fechaApertura: 'DESC' },
    });

    if (usuario.perfil === UserRole.PRODUCTOR) {
      return reclamos.filter((r) => r.productor?.id === usuario.productor?.id);
    }
    if (usuario.perfil === UserRole.ASEGURADO) {
      return reclamos.filter((r) => r.asegurado?.id === usuario.asegurado?.id);
    }
    return reclamos;
  }

  async findOne(id: string, usuario: Usuario): Promise<Reclamo> {
    const reclamo = await this.reclamoRepo.findOne({
      where: { id },
      relations: ['asegurado', 'productor', 'compania'],
    });
    if (!reclamo) throw new NotFoundException(`Reclamo ${id} no encontrado`);
    this.checkAccess(reclamo, usuario);
    return reclamo;
  }

  async create(dto: CreateReclamoDto, usuario: Usuario): Promise<Reclamo> {
    const asegurado = await this.aseguradoRepo.findOne({ where: { id: dto.aseguradoId } });
    if (!asegurado) throw new NotFoundException(`Asegurado ${dto.aseguradoId} no encontrado`);

    const productor = await this.productorRepo.findOne({ where: { id: dto.productorId } });
    if (!productor) throw new NotFoundException(`Productor ${dto.productorId} no encontrado`);

    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      usuario.productor?.id !== dto.productorId
    ) {
      throw new ForbiddenException('Solo podés crear reclamos en tu propia cartera');
    }

    let compania: CompaniaAseguradora | null = null;
    if (dto.companiaId) {
      compania = await this.companiaRepo.findOne({ where: { id: dto.companiaId } });
      if (!compania) throw new NotFoundException(`Compañía ${dto.companiaId} no encontrada`);
    }

    const reclamo = this.reclamoRepo.create({
      tipo: dto.tipo,
      descripcion: dto.descripcion ?? null,
      fechaApertura: new Date(dto.fechaApertura),
      asegurado,
      productor,
      compania,
    });
    return this.reclamoRepo.save(reclamo);
  }

  async updateEstado(id: string, dto: UpdateReclamoEstadoDto, usuario: Usuario): Promise<Reclamo> {
    const reclamo = await this.findOne(id, usuario);
    reclamo.estado = dto.estado;
    return this.reclamoRepo.save(reclamo);
  }

  private checkAccess(reclamo: Reclamo, usuario: Usuario): void {
    if (
      usuario.perfil === UserRole.ASEGURADO &&
      reclamo.asegurado?.id !== usuario.asegurado?.id
    ) {
      throw new ForbiddenException('Solo podés acceder a tus propios reclamos');
    }
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      reclamo.productor?.id !== usuario.productor?.id
    ) {
      throw new ForbiddenException('Este reclamo no pertenece a tu cartera');
    }
  }
}
