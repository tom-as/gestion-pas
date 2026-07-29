import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from '../database/entities/documento.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Siniestro } from '../database/entities/siniestro.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { EntidadDocumento } from '@gestion-pas/types';
import { CreateDocumentoDto } from './dto/documento.dto';

@Injectable()
export class DocumentosService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepo: Repository<Documento>,
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
  ) {}

  async findByEntidad(entidad: EntidadDocumento, entidadId: string): Promise<Documento[]> {
    const relationField = this.entidadToField(entidad);
    return this.documentoRepo.find({
      where: { [relationField]: { id: entidadId }, entidadVinculada: entidad },
      order: { fechaIncorporacion: 'DESC' },
    });
  }

  async create(dto: CreateDocumentoDto): Promise<Documento> {
    const fkField = this.entidadToField(dto.entidadVinculada);
    const entidad = await this.loadEntidad(dto.entidadVinculada, dto.entidadId);

    const documento = this.documentoRepo.create({
      tipo: dto.tipo,
      entidadVinculada: dto.entidadVinculada,
      archivoUrl: dto.archivoUrl,
      tramiteContexto: dto.tramiteContexto ?? null,
      [fkField]: entidad,
    });
    return this.documentoRepo.save(documento);
  }

  private async loadEntidad(entidad: EntidadDocumento, id: string): Promise<object> {
    const repos: Record<EntidadDocumento, Repository<object>> = {
      [EntidadDocumento.ASEGURADO]: this.aseguradoRepo,
      [EntidadDocumento.BIEN]: this.bienRepo,
      [EntidadDocumento.POLIZA]: this.polizaRepo,
      [EntidadDocumento.CUOTA]: this.cuotaRepo,
      [EntidadDocumento.SINIESTRO]: this.siniestroRepo,
      [EntidadDocumento.RECLAMO]: this.reclamoRepo,
    };
    const repo = repos[entidad];
    if (!repo) throw new BadRequestException(`Entidad '${entidad}' no soportada`);

    const found = await repo.findOne({ where: { id } } as Parameters<typeof repo.findOne>[0]);
    if (!found) throw new NotFoundException(`Entidad ${entidad} con id ${id} no encontrada`);
    return found;
  }

  private entidadToField(entidad: EntidadDocumento): string {
    const map: Record<EntidadDocumento, string> = {
      [EntidadDocumento.ASEGURADO]: 'asegurado',
      [EntidadDocumento.BIEN]: 'bienAsegurado',
      [EntidadDocumento.POLIZA]: 'poliza',
      [EntidadDocumento.CUOTA]: 'cuota',
      [EntidadDocumento.SINIESTRO]: 'siniestro',
      [EntidadDocumento.RECLAMO]: 'reclamo',
    };
    return map[entidad];
  }
}
