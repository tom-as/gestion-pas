import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoProductor } from '@gestion-pas/types';
import { Organizador } from './organizador.entity';
import { Asegurado } from './asegurado.entity';
import { Poliza } from './poliza.entity';

@Entity('productores')
export class Productor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  dniCuil: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @Column({ type: 'date', nullable: true })
  fechaIncorporacion: Date | null;

  @Column({ type: 'text', nullable: true })
  companiasOpera: string | null;

  @Column({
    type: 'enum',
    enum: EstadoProductor,
    default: EstadoProductor.ACTIVO,
  })
  estado: EstadoProductor;

  @ManyToOne(() => Organizador, (o) => o.productores, { nullable: false })
  @JoinColumn({ name: 'organizador_id' })
  organizador: Organizador;

  @OneToMany(() => Asegurado, (a) => a.productor)
  asegurados: Asegurado[];

  @OneToMany(() => Poliza, (p) => p.productor)
  polizas: Poliza[];
}
