import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { UserRole } from '@gestion-pas/types';
import { CreateBienAseguradoDto } from './dto/create-bien-asegurado.dto';
import { UpdateBienAseguradoDto } from './dto/update-bien-asegurado.dto';

@Injectable()
export class BienesService {
  constructor(
    @InjectRepository(BienAsegurado)
    private readonly bienRepo: Repository<BienAsegurado>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
  ) {}

  async findAll(usuario: Usuario): Promise<BienAsegurado[]> {
    const bienes = await this.bienRepo.find({
      relations: ['asegurado', 'asegurado.productor'],
      order: { tipo: 'ASC' },
    });

    if (usuario.perfil === UserRole.PRODUCTOR) {
      return bienes.filter(
        (b) => b.asegurado?.productor?.id === usuario.productor?.id,
      );
    }
    if (usuario.perfil === UserRole.ASEGURADO) {
      return bienes.filter((b) => b.asegurado?.id === usuario.asegurado?.id);
    }
    return bienes;
  }

  async findByAsegurado(aseguradoId: string, usuario: Usuario): Promise<BienAsegurado[]> {
    const asegurado = await this.aseguradoRepo.findOne({
      where: { id: aseguradoId },
      relations: ['productor'],
    });
    if (!asegurado) throw new NotFoundException(`Asegurado ${aseguradoId} no encontrado`);
    this.checkAseguradoAccess(asegurado, usuario);

    return this.bienRepo.find({
      where: { asegurado: { id: aseguradoId } },
      order: { tipo: 'ASC' },
    });
  }

  async findOne(id: string, usuario: Usuario): Promise<BienAsegurado> {
    const bien = await this.bienRepo.findOne({
      where: { id },
      relations: ['asegurado', 'asegurado.productor'],
    });
    if (!bien) throw new NotFoundException(`Bien asegurado ${id} no encontrado`);
    this.checkAseguradoAccess(bien.asegurado, usuario);
    return bien;
  }

  async create(dto: CreateBienAseguradoDto, usuario: Usuario): Promise<BienAsegurado> {
    const asegurado = await this.aseguradoRepo.findOne({
      where: { id: dto.aseguradoId },
      relations: ['productor'],
    });
    if (!asegurado) throw new NotFoundException(`Asegurado ${dto.aseguradoId} no encontrado`);
    this.checkAseguradoAccess(asegurado, usuario);

    const bien = this.bienRepo.create({
      tipo: dto.tipo,
      sumaAsegurada: dto.sumaAsegurada,
      patente: dto.patente,
      marca: dto.marca,
      modelo: dto.modelo,
      version: dto.version,
      anioFabricacion: dto.anioFabricacion,
      uso: dto.uso,
      tieneGnc: dto.tieneGnc,
      accesoriosDeclarados: dto.accesoriosDeclarados,
      asegurado,
    });
    return this.bienRepo.save(bien);
  }

  async update(id: string, dto: UpdateBienAseguradoDto, usuario: Usuario): Promise<BienAsegurado> {
    const bien = await this.findOne(id, usuario);

    Object.assign(bien, {
      sumaAsegurada: dto.sumaAsegurada ?? bien.sumaAsegurada,
      marca: dto.marca ?? bien.marca,
      modelo: dto.modelo ?? bien.modelo,
      version: dto.version ?? bien.version,
      anioFabricacion: dto.anioFabricacion ?? bien.anioFabricacion,
      uso: dto.uso ?? bien.uso,
      tieneGnc: dto.tieneGnc ?? bien.tieneGnc,
      accesoriosDeclarados: dto.accesoriosDeclarados ?? bien.accesoriosDeclarados,
    });
    return this.bienRepo.save(bien);
  }

  private checkAseguradoAccess(asegurado: Asegurado, usuario: Usuario): void {
    if (usuario.perfil === UserRole.ASEGURADO && asegurado.id !== usuario.asegurado?.id) {
      throw new ForbiddenException('Solo podés acceder a tus propios bienes');
    }
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      asegurado.productor?.id !== usuario.productor?.id
    ) {
      throw new ForbiddenException('Este bien no pertenece a tu cartera');
    }
  }
}
