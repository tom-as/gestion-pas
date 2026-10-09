import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export type TipoNotificacion =
  | 'comentario_reclamo'
  | 'estado_reclamo'
  | 'comentario_siniestro'
  | 'estado_siniestro';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Tipo de evento que originó la notificación */
  @Column({ type: 'varchar', length: 50 })
  tipo: TipoNotificacion;

  /** Texto breve para mostrar en la campana */
  @Column({ type: 'varchar', length: 300 })
  titulo: string;

  /** Detalle secundario (nombre del asegurado, nuevo estado, etc.) */
  @Column({ type: 'varchar', length: 300, nullable: true })
  subtitulo: string | null;

  /** URL de navegación en el frontend */
  @Column({ type: 'varchar', length: 300 })
  href: string;

  /** Si el usuario ya la leyó */
  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn()
  creadaEn: Date;

  /** Destinatario de la notificación */
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'destinatario_id' })
  destinatario: Usuario;
}
