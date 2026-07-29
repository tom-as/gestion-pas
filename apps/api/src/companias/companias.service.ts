import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { CreateCompaniaDto, UpdateCompaniaDto } from './dto/compania.dto';

@Injectable()
export class CompaniasService {
  constructor(
    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,
  ) {}

  findAll(): Promise<CompaniaAseguradora[]> {
    return this.companiaRepo.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<CompaniaAseguradora> {
    const c = await this.companiaRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Compañía aseguradora ${id} no encontrada`);
    return c;
  }

  async create(dto: CreateCompaniaDto): Promise<CompaniaAseguradora> {
    const exists = await this.companiaRepo.findOne({ where: { nombre: dto.nombre } });
    if (exists) throw new ConflictException(`Ya existe una compañía llamada '${dto.nombre}'`);

    const compania = this.companiaRepo.create({
      nombre: dto.nombre,
      periodoDGraciaDias: dto.periodoDGraciaDias,
      periodicidadRefacturacion: dto.periodicidadRefacturacion,
      mecanismoNotificacion: dto.mecanismoNotificacion,
    });
    return this.companiaRepo.save(compania);
  }

  async update(id: string, dto: UpdateCompaniaDto): Promise<CompaniaAseguradora> {
    const compania = await this.findOne(id);
    Object.assign(compania, {
      periodoDGraciaDias: dto.periodoDGraciaDias ?? compania.periodoDGraciaDias,
      periodicidadRefacturacion: dto.periodicidadRefacturacion ?? compania.periodicidadRefacturacion,
      mecanismoNotificacion: dto.mecanismoNotificacion ?? compania.mecanismoNotificacion,
    });
    return this.companiaRepo.save(compania);
  }
}
