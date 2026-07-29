import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Productor } from './productor.entity';
import { BienAsegurado } from './bien-asegurado.entity';
import { Poliza } from './poliza.entity';
import { Siniestro } from './siniestro.entity';
import { Reclamo } from './reclamo.entity';

@Entity('asegurados')
export class Asegurado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  /** DNI o CUIL — identificador único del asegurado en toda la organización */
  @Column({ type: 'varchar', length: 20, unique: true })
  dniCuil: string;

  @Column({ type: 'date', nullable: true })
  fechaNacimiento: Date | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigoPostal: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null;

  @ManyToOne(() => Productor, (p) => p.asegurados, { nullable: false })
  @JoinColumn({ name: 'productor_id' })
  productor: Productor;

  @OneToMany(() => BienAsegurado, (b) => b.asegurado)
  bienes: BienAsegurado[];

  @OneToMany(() => Poliza, (p) => p.asegurado)
  polizas: Poliza[];

  @OneToMany(() => Siniestro, (s) => s.asegurado)
  siniestros: Siniestro[];

  @OneToMany(() => Reclamo, (r) => r.asegurado)
  reclamos: Reclamo[];
}
