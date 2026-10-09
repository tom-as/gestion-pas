import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reclamo } from '../database/entities/reclamo.entity';
import { ComentarioReclamo } from '../database/entities/comentario-reclamo.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { UserRole } from '@gestion-pas/types';
import { CreateReclamoDto, UpdateReclamoEstadoDto } from './dto/reclamo.dto';
import { CreateComentarioDto } from '../notificaciones/dto/notificacion.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class ReclamosService {
  constructor(
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectRepository(ComentarioReclamo)
    private readonly comentarioRepo: Repository<ComentarioReclamo>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(CompaniaAseguradora)
    private readonly companiaRepo: Repository<CompaniaAseguradora>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly notificacionesService: NotificacionesService,
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
    // ASEGURADO: forzar que el reclamo sea siempre sobre sí mismo
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
      if (!asegurado.productor) {
        throw new ForbiddenException('Tu asegurado no tiene un productor asignado');
      }
      dto.productorId = asegurado.productor.id;
    }

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
    const estadoAnterior = reclamo.estado;
    reclamo.estado = dto.estado;
    const saved = await this.reclamoRepo.save(reclamo);

    // Notificar al asegurado del cambio de estado
    if (estadoAnterior !== dto.estado) {
      await this.notificarCambioEstado(saved, usuario);
    }

    return saved;
  }

  /* ── Comentarios ─────────────────────────────────────────── */

  async findComentarios(reclamoId: string, usuario: Usuario): Promise<ComentarioReclamo[]> {
    const reclamo = await this.findOne(reclamoId, usuario);
    return this.comentarioRepo.find({
      where: { reclamo: { id: reclamo.id } },
      relations: ['autor'],
      order: { creadoEn: 'ASC' },
    });
  }

  async addComentario(
    reclamoId: string,
    dto: CreateComentarioDto,
    usuario: Usuario,
  ): Promise<ComentarioReclamo> {
    const reclamo = await this.reclamoRepo.findOne({
      where: { id: reclamoId },
      relations: ['asegurado', 'productor', 'compania'],
    });
    if (!reclamo) throw new NotFoundException(`Reclamo ${reclamoId} no encontrado`);
    this.checkAccess(reclamo, usuario);

    const comentario = this.comentarioRepo.create({
      texto: dto.texto,
      reclamo,
      autor: usuario,
    });
    const saved = await this.comentarioRepo.save(comentario);

    // Notificar a la otra parte
    await this.notificarComentario(reclamo, usuario);

    return saved;
  }

  /* ── Helpers privados ────────────────────────────────────── */

  /** Busca el usuario vinculado a un asegurado */
  private async findUsuarioAsegurado(aseguradoId: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({
      where: { asegurado: { id: aseguradoId } },
    });
  }

  /** Busca el usuario vinculado a un productor */
  private async findUsuarioProductor(productorId: string): Promise<Usuario | null> {
    return this.usuarioRepo.findOne({
      where: { productor: { id: productorId } },
    });
  }

  /**
   * Notifica a la "otra parte" cuando se agrega un comentario.
   * Si el autor es el asegurado → notifica al productor, y viceversa.
   */
  private async notificarComentario(reclamo: Reclamo, autor: Usuario): Promise<void> {
    let destinatario: Usuario | null = null;

    if (autor.perfil === UserRole.ASEGURADO) {
      destinatario = await this.findUsuarioProductor(reclamo.productor.id);
    } else {
      // PRODUCTOR u ORGANIZADOR → notifica al asegurado
      destinatario = await this.findUsuarioAsegurado(reclamo.asegurado.id);
    }

    if (destinatario) {
      await this.notificacionesService.crear(
        destinatario,
        'comentario_reclamo',
        `Nuevo comentario en reclamo`,
        `${autor.perfil === UserRole.ASEGURADO ? reclamo.asegurado?.nombre ?? 'Asegurado' : reclamo.productor?.nombre ?? 'Productor'} comentó en el reclamo`,
        `/reclamos/${reclamo.id}`,
      );
    }
  }

  /**
   * Notifica al asegurado cuando el productor/org cambia el estado.
   */
  private async notificarCambioEstado(reclamo: Reclamo, autor: Usuario): Promise<void> {
    let destinatario: Usuario | null = null;

    if (autor.perfil === UserRole.ASEGURADO) {
      // Un asegurado no puede cambiar estado, pero por si acaso notifica al productor
      destinatario = await this.findUsuarioProductor(reclamo.productor.id);
    } else {
      destinatario = await this.findUsuarioAsegurado(reclamo.asegurado.id);
    }

    if (destinatario) {
      await this.notificacionesService.crear(
        destinatario,
        'estado_reclamo',
        `Estado de reclamo actualizado`,
        `El reclamo pasó a "${reclamo.estado}"`,
        `/reclamos/${reclamo.id}`,
      );
    }
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
