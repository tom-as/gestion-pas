import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Siniestro } from '../database/entities/siniestro.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { UserRole } from '@gestion-pas/types';
import { CreateSiniestroDto, UpdateSiniestroEstadoDto } from './dto/siniestro.dto';

@Injectable()
export class SiniestrosService {
  constructor(
    @InjectRepository(Siniestro)
    private readonly siniestroRepo: Repository<Siniestro>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(BienAsegurado)
    private readonly bienRepo: Repository<BienAsegurado>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,
  ) {}

  async findAll(usuario: Usuario): Promise<Siniestro[]> {
    const siniestros = await this.siniestroRepo.find({
      relations: ['asegurado', 'bien', 'productor', 'compania'],
      order: { fechaOcurrencia: 'DESC' },
    });

    if (usuario.perfil === UserRole.PRODUCTOR) {
      return siniestros.filter((s) => s.productor?.id === usuario.productor?.id);
    }
    if (usuario.perfil === UserRole.ASEGURADO) {
      return siniestros.filter((s) => s.asegurado?.id === usuario.asegurado?.id);
    }
    return siniestros;
  }

  async findOne(id: string, usuario: Usuario): Promise<Siniestro> {
    const siniestro = await this.siniestroRepo.findOne({
      where: { id },
      relations: ['asegurado', 'bien', 'productor', 'compania'],
    });
    if (!siniestro) throw new NotFoundException(`Siniestro ${id} no encontrado`);
    this.checkAccess(siniestro, usuario);
    return siniestro;
  }

  async create(dto: CreateSiniestroDto, usuario: Usuario): Promise<Siniestro> {
    const asegurado = await this.aseguradoRepo.findOne({ where: { id: dto.aseguradoId } });
    if (!asegurado) throw new NotFoundException(`Asegurado ${dto.aseguradoId} no encontrado`);

    const bien = await this.bienRepo.findOne({ where: { id: dto.bienId } });
    if (!bien) throw new NotFoundException(`Bien ${dto.bienId} no encontrado`);

    const productor = await this.productorRepo.findOne({ where: { id: dto.productorId } });
    if (!productor) throw new NotFoundException(`Productor ${dto.productorId} no encontrado`);

    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      usuario.productor?.id !== dto.productorId
    ) {
      throw new ForbiddenException('Solo podés crear siniestros en tu propia cartera');
    }

    const compania = await this.companiaRepo.findOne({ where: { id: dto.companiaId } });
    if (!compania) throw new NotFoundException(`Compañía ${dto.companiaId} no encontrada`);

    const siniestro = this.siniestroRepo.create({
      tipo: dto.tipo,
      fechaOcurrencia: new Date(dto.fechaOcurrencia),
      horaOcurrencia: dto.horaOcurrencia ?? null,
      lugarOcurrencia: dto.lugarOcurrencia ?? null,
      relato: dto.relato ?? null,
      datosTerceros: dto.datosTerceros ?? null,
      numeroDenunciaCompania: dto.numeroDenunciaCompania ?? null,
      asegurado,
      bien,
      productor,
      compania,
    });
    return this.siniestroRepo.save(siniestro);
  }

  async updateEstado(id: string, dto: UpdateSiniestroEstadoDto, usuario: Usuario): Promise<Siniestro> {
    const siniestro = await this.findOne(id, usuario);
    siniestro.estado = dto.estado;
    if (dto.numeroDenunciaCompania !== undefined) {
      siniestro.numeroDenunciaCompania = dto.numeroDenunciaCompania;
    }
    return this.siniestroRepo.save(siniestro);
  }

  private checkAccess(siniestro: Siniestro, usuario: Usuario): void {
    if (
      usuario.perfil === UserRole.ASEGURADO &&
      siniestro.asegurado?.id !== usuario.asegurado?.id
    ) {
      throw new ForbiddenException('Solo podés acceder a tus propios siniestros');
    }
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      siniestro.productor?.id !== usuario.productor?.id
    ) {
      throw new ForbiddenException('Este siniestro no pertenece a tu cartera');
    }
  }
}
