import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoReclamo, TipoReclamo } from '@gestion-pas/types';
import { Asegurado } from './asegurado.entity';
import { Productor } from './productor.entity';
import { CompaniaAseguradora } from './compania-aseguradora.entity';
import { ComentarioReclamo } from './comentario-reclamo.entity';

@Entity('reclamos')
export class Reclamo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoReclamo })
  tipo: TipoReclamo;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({
    type: 'enum',
    enum: EstadoReclamo,
    default: EstadoReclamo.ABIERTO,
  })
  estado: EstadoReclamo;

  @Column({ type: 'date' })
  fechaApertura: Date;

  @ManyToOne(() => Asegurado, (a) => a.reclamos, { nullable: false })
  @JoinColumn({ name: 'asegurado_id' })
  asegurado: Asegurado;

  @ManyToOne(() => Productor, { nullable: false })
  @JoinColumn({ name: 'productor_id' })
  productor: Productor;

  @ManyToOne(() => CompaniaAseguradora, (c) => c.reclamos, { nullable: true })
  @JoinColumn({ name: 'compania_id' })
  compania: CompaniaAseguradora | null;

  @OneToMany(() => ComentarioReclamo, (c) => c.reclamo)
  comentarios: ComentarioReclamo[];
}
