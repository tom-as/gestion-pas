import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Productor } from './productor.entity';

@Entity('organizadores')
export class Organizador {
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

  @OneToMany(() => Productor, (p) => p.organizador)
  productores: Productor[];
}
