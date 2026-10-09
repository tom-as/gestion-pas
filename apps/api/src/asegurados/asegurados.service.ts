import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { EstadoCuota, EstadoPoliza, UserRole } from '@gestion-pas/types';
import { CreateAseguradoDto } from './dto/create-asegurado.dto';
import { UpdateAseguradoDto } from './dto/update-asegurado.dto';

export interface AseguradoStats {
  polizasActivas: number;
  cuotasTotal: number;
  cuotasPagas: number;
  pctCuotasPagas: number | null;
}

@Injectable()
export class AseguradosService {
  constructor(
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    @InjectRepository(Poliza)
    private readonly polizaRepo: Repository<Poliza>,
  ) {}

  async findAll(usuario: Usuario, search?: string): Promise<Asegurado[]> {
    // El filtro de cartera se aplica en la query (no en memoria) para evitar
    // traer filas de otros productores y descartarlas después.
    const cartFilter =
      usuario.perfil === UserRole.PRODUCTOR
        ? { productor: { id: usuario.productor?.id } }
        : undefined;

    let where: object | object[];
    if (search) {
      where = [
        { nombre: ILike(`%${search}%`), ...cartFilter },
        { dniCuil: ILike(`%${search}%`), ...cartFilter },
      ];
    } else {
      where = cartFilter ?? {};
    }

    return this.aseguradoRepo.find({
      where,
      relations: ['productor'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string, usuario: Usuario): Promise<Asegurado> {
    const asegurado = await this.aseguradoRepo.findOne({
      where: { id },
      relations: ['productor', 'bienes', 'polizas'],
    });
    if (!asegurado) throw new NotFoundException(`Asegurado ${id} no encontrado`);
    this.checkAccess(asegurado, usuario);
    return asegurado;
  }

  async create(dto: CreateAseguradoDto, usuario: Usuario): Promise<Asegurado> {
    // Verificar unicidad de DNI/CUIL
    const exists = await this.aseguradoRepo.findOne({ where: { dniCuil: dto.dniCuil } });
    if (exists) {
      throw new ConflictException(`Ya existe un asegurado con DNI/CUIL '${dto.dniCuil}'`);
    }

    const productor = await this.productorRepo.findOne({ where: { id: dto.productorId } });
    if (!productor) throw new NotFoundException(`Productor ${dto.productorId} no encontrado`);

    // El productor solo puede crear asegurados en su propia cartera
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      usuario.productor?.id !== dto.productorId
    ) {
      throw new ForbiddenException('Solo podés crear asegurados en tu propia cartera');
    }

    const asegurado = this.aseguradoRepo.create({
      nombre: dto.nombre,
      dniCuil: dto.dniCuil,
      fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      direccion: dto.direccion,
      codigoPostal: dto.codigoPostal,
      telefono: dto.telefono,
      email: dto.email,
      productor,
    });
    return this.aseguradoRepo.save(asegurado);
  }

  async update(id: string, dto: UpdateAseguradoDto, usuario: Usuario): Promise<Asegurado> {
    const asegurado = await this.findOne(id, usuario);

    if (dto.productorId) {
      const productor = await this.productorRepo.findOne({ where: { id: dto.productorId } });
      if (!productor) throw new NotFoundException(`Productor ${dto.productorId} no encontrado`);
      asegurado.productor = productor;
    }

    Object.assign(asegurado, {
      nombre: dto.nombre ?? asegurado.nombre,
      fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : asegurado.fechaNacimiento,
      direccion: dto.direccion ?? asegurado.direccion,
      codigoPostal: dto.codigoPostal ?? asegurado.codigoPostal,
      telefono: dto.telefono ?? asegurado.telefono,
      email: dto.email ?? asegurado.email,
    });

    return this.aseguradoRepo.save(asegurado);
  }

  async getStats(id: string, usuario: Usuario): Promise<AseguradoStats> {
    const asegurado = await this.aseguradoRepo.findOne({
      where: { id },
      relations: ['productor'],
    });
    if (!asegurado) throw new NotFoundException(`Asegurado ${id} no encontrado`);
    this.checkAccess(asegurado, usuario);

    // Contar pólizas activas
    const polizasActivas = await this.polizaRepo
      .createQueryBuilder('p')
      .where('p.asegurado_id = :id', { id })
      .andWhere('p.estado = :estado', { estado: EstadoPoliza.ACTIVA })
      .getCount();

    // Contar cuotas totales y pagas a través de las pólizas del asegurado
    const cuotasTotal = await this.cuotaRepo
      .createQueryBuilder('c')
      .innerJoin('c.poliza', 'p')
      .where('p.asegurado_id = :id', { id })
      .getCount();

    const cuotasPagas = await this.cuotaRepo
      .createQueryBuilder('c')
      .innerJoin('c.poliza', 'p')
      .where('p.asegurado_id = :id', { id })
      .andWhere('c.estado = :estado', { estado: EstadoCuota.PAGADA })
      .getCount();

    const pctCuotasPagas =
      cuotasTotal > 0 ? Math.round((cuotasPagas / cuotasTotal) * 100) : null;

    return { polizasActivas, cuotasTotal, cuotasPagas, pctCuotasPagas };
  }

  private checkAccess(asegurado: Asegurado, usuario: Usuario): void {
    if (usuario.perfil === UserRole.ASEGURADO && asegurado.id !== usuario.asegurado?.id) {
      throw new ForbiddenException('Solo podés acceder a tu propia información');
    }
    if (
      usuario.perfil === UserRole.PRODUCTOR &&
      asegurado.productor?.id !== usuario.productor?.id
    ) {
      throw new ForbiddenException('Este asegurado no pertenece a tu cartera');
    }
  }
}
