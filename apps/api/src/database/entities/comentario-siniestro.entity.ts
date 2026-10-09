import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Siniestro } from './siniestro.entity';
import { Usuario } from './usuario.entity';

@Entity('comentarios_siniestro')
export class ComentarioSiniestro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  texto: string;

  @CreateDateColumn()
  creadoEn: Date;

  @ManyToOne(() => Siniestro, (s) => s.comentarios, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siniestro_id' })
  siniestro: Siniestro;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'autor_id' })
  autor: Usuario;
}
