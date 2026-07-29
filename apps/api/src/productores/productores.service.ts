import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Productor } from '../database/entities/productor.entity';
import { Organizador } from '../database/entities/organizador.entity';
import { CreateProductorDto, UpdateProductorDto } from './dto/productor.dto';

@Injectable()
export class ProductoresService {
  constructor(
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(Organizador)
    private readonly organizadorRepo: Repository<Organizador>,
  ) {}

  findAll(): Promise<Productor[]> {
    return this.productorRepo.find({
      relations: ['organizador'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Productor> {
    const p = await this.productorRepo.findOne({
      where: { id },
      relations: ['organizador', 'asegurados'],
    });
    if (!p) throw new NotFoundException(`Productor ${id} no encontrado`);
    return p;
  }

  async create(dto: CreateProductorDto): Promise<Productor> {
    const exists = await this.productorRepo.findOne({ where: { dniCuil: dto.dniCuil } });
    if (exists) throw new ConflictException(`Ya existe un productor con DNI/CUIL '${dto.dniCuil}'`);

    const organizador = await this.organizadorRepo.findOne({ where: { id: dto.organizadorId } });
    if (!organizador) throw new NotFoundException(`Organizador ${dto.organizadorId} no encontrado`);

    const productor = this.productorRepo.create({
      nombre: dto.nombre,
      dniCuil: dto.dniCuil,
      telefono: dto.telefono,
      email: dto.email,
      fechaIncorporacion: dto.fechaIncorporacion ? new Date(dto.fechaIncorporacion) : undefined,
      companiasOpera: dto.companiasOpera,
      organizador,
    });
    return this.productorRepo.save(productor);
  }

  async update(id: string, dto: UpdateProductorDto): Promise<Productor> {
    const productor = await this.findOne(id);
    Object.assign(productor, {
      nombre: dto.nombre ?? productor.nombre,
      telefono: dto.telefono ?? productor.telefono,
      email: dto.email ?? productor.email,
      fechaIncorporacion: dto.fechaIncorporacion ? new Date(dto.fechaIncorporacion) : productor.fechaIncorporacion,
      companiasOpera: dto.companiasOpera ?? productor.companiasOpera,
      estado: dto.estado ?? productor.estado,
    });
    return this.productorRepo.save(productor);
  }
}
