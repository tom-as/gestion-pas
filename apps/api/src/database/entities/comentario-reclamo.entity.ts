import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reclamo } from './reclamo.entity';
import { Usuario } from './usuario.entity';

@Entity('comentarios_reclamo')
export class ComentarioReclamo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  texto: string;

  @CreateDateColumn()
  creadoEn: Date;

  @ManyToOne(() => Reclamo, (r) => r.comentarios, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reclamo_id' })
  reclamo: Reclamo;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'autor_id' })
  autor: Usuario;
}
