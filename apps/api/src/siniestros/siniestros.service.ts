import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Siniestro } from '../database/entities/siniestro.entity';
import { ComentarioSiniestro } from '../database/entities/comentario-siniestro.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { UserRole } from '@gestion-pas/types';
import { CreateSiniestroDto, UpdateSiniestroEstadoDto } from './dto/siniestro.dto';
import { CreateComentarioDto } from '../notificaciones/dto/notificacion.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class SiniestrosService {
  constructor(
    @InjectRepository(Siniestro)
    private readonly siniestroRepo: Repository<Siniestro>,
    @InjectRepository(ComentarioSiniestro)
    private readonly comentarioRepo: Repository<ComentarioSiniestro>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(BienAsegurado)
    private readonly bienRepo: Repository<BienAsegurado>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly notificacionesService: NotificacionesService,
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
    // ASEGURADO: forzar que el siniestro sea siempre sobre sí mismo
    if (usuario.perfil === UserRole.ASEGURADO) {
      if (!usuario.asegurado) {
        throw new ForbiddenException('Tu usuario no está vinculado a ningún asegurado');
      }
      dto.aseguradoId = usuario.asegurado.id;
    }

    const asegurado = await this.aseguradoRepo.findOne({
      where: { id: dto.aseguradoId },
      relations: ['productor'],
    });
    if (!asegurado) throw new NotFoundException(`Asegurado ${dto.aseguradoId} no encontrado`);

    // ASEGURADO: forzar productor del asegurado, ignorar lo que venga en el DTO
    if (usuario.perfil === UserRole.ASEGURADO) {
      dto.productorId = asegurado.productor.id;
    }

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

  async updateEstado(
    id: string,
    dto: UpdateSiniestroEstadoDto,
    usuario: Usuario,
  ): Promise<Siniestro> {
    const siniestro = await this.findOne(id, usuario);
    const estadoAnterior = siniestro.estado;
    siniestro.estado = dto.estado;
    if (dto.numeroDenunciaCompania !== undefined) {
      siniestro.numeroDenunciaCompania = dto.numeroDenunciaCompania;
    }
    const saved = await this.siniestroRepo.save(siniestro);

    // Notificar al asegurado del cambio de estado
    if (estadoAnterior !== dto.estado) {
      await this.notificarCambioEstado(saved, usuario);
    }

    return saved;
  }

  /* ── Comentarios ─────────────────────────────────────────── */

  async findComentarios(siniestroId: string, usuario: Usuario): Promise<ComentarioSiniestro[]> {
    const siniestro = await this.findOne(siniestroId, usuario);
    return this.comentarioRepo.find({
      where: { siniestro: { id: siniestro.id } },
      relations: ['autor'],
      order: { creadoEn: 'ASC' },
    });
  }

  async addComentario(
    siniestroId: string,
    dto: CreateComentarioDto,
    usuario: Usuario,
  ): Promise<ComentarioSiniestro> {
    const siniestro = await this.siniestroRepo.findOne({
      where: { id: siniestroId },
      relations: ['asegurado', 'productor', 'compania'],
    });
    if (!siniestro) throw new NotFoundException(`Siniestro ${siniestroId} no encontrado`);
    this.checkAccess(siniestro, usuario);

    const comentario = this.comentarioRepo.create({
      texto: dto.texto,
      siniestro,
      autor: usuario,
    });
    const saved = await this.comentarioRepo.save(comentario);

    // Notificar a la otra parte
    await this.notificarComentario(siniestro, usuario);

    return saved;
  }

  /* ── Helpers privados ────────────────────────────────────── */

  private async findUsuarioAsegurado(aseguradoId: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({
      where: { asegurado: { id: aseguradoId } },
    });
  }

  private async findUsuarioProductor(productorId: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({
      where: { productor: { id: productorId } },
    });
  }

  private async notificarComentario(siniestro: Siniestro, autor: Usuario): Promise<void> {
    let destinatario: Usuario | null = null;

    if (autor.perfil === UserRole.ASEGURADO) {
      destinatario = await this.findUsuarioProductor(siniestro.productor.id);
    } else {
      destinatario = await this.findUsuarioAsegurado(siniestro.asegurado.id);
    }

    if (destinatario) {
      await this.notificacionesService.crear(
        destinatario,
        'comentario_siniestro',
        `Nuevo comentario en siniestro`,
        `${autor.perfil === UserRole.ASEGURADO ? siniestro.asegurado?.nombre ?? 'Asegurado' : siniestro.productor?.nombre ?? 'Productor'} comentó en el siniestro`,
        `/siniestros/${siniestro.id}`,
      );
    }
  }

  private async notificarCambioEstado(siniestro: Siniestro, autor: Usuario): Promise<void> {
    let destinatario: Usuario | null = null;

    if (autor.perfil === UserRole.ASEGURADO) {
      destinatario = await this.findUsuarioProductor(siniestro.productor.id);
    } else {
      destinatario = await this.findUsuarioAsegurado(siniestro.asegurado.id);
    }

    if (destinatario) {
      await this.notificacionesService.crear(
        destinatario,
        'estado_siniestro',
        `Estado de siniestro actualizado`,
        `El siniestro pasó a "${siniestro.estado}"`,
        `/siniestros/${siniestro.id}`,
      );
    }
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
