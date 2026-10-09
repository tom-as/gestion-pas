import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion, TipoNotificacion } from '../database/entities/notificacion.entity';
import { Usuario } from '../database/entities/usuario.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notifRepo: Repository<Notificacion>,
  ) {}

  /** Crea una notificación para el destinatario indicado */
  async crear(
    destinatario: Usuario,
    tipo: TipoNotificacion,
    titulo: string,
    subtitulo: string | null,
    href: string,
  ): Promise<void> {
    const notif = this.notifRepo.create({ destinatario, tipo, titulo, subtitulo, href });
    await this.notifRepo.save(notif);
  }

  /** Devuelve las notificaciones no leídas del usuario autenticado */
  async findNoLeidas(usuario: Usuario): Promise<Notificacion[]> {
    return this.notifRepo.find({
      where: { destinatario: { id: usuario.id }, leida: false },
      order: { creadaEn: 'DESC' },
      take: 50,
    });
  }

  /** Devuelve todas las notificaciones del usuario (leídas + no leídas) */
  async findAll(usuario: Usuario): Promise<Notificacion[]> {
    return this.notifRepo.find({
      where: { destinatario: { id: usuario.id } },
      order: { creadaEn: 'DESC' },
      take: 50,
    });
  }

  /** Marca todas las notificaciones del usuario como leídas */
  async marcarTodasLeidas(usuario: Usuario): Promise<void> {
    await this.notifRepo.update(
      { destinatario: { id: usuario.id }, leida: false },
      { leida: true },
    );
  }

  /** Marca una notificación específica como leída */
  async marcarLeida(id: string, usuario: Usuario): Promise<void> {
    await this.notifRepo.update(
      { id, destinatario: { id: usuario.id } },
      { leida: true },
    );
  }
}
