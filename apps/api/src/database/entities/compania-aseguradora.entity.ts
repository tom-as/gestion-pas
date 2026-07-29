import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PeriodicidadRefacturacion } from '@gestion-pas/types';
import { Poliza } from './poliza.entity';
import { Siniestro } from './siniestro.entity';
import { Reclamo } from './reclamo.entity';

@Entity('companias_aseguradoras')
export class CompaniaAseguradora {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  nombre: string;

  /** Días de gracia ante un rechazo de pago (varía por compañía: 3, 5, 10 días...) */
  @Column({ type: 'int', nullable: true })
  periodoDGraciaDias: number | null;

  @Column({
    type: 'enum',
    enum: PeriodicidadRefacturacion,
    nullable: true,
  })
  periodicidadRefacturacion: PeriodicidadRefacturacion | null;

  /** Descripción del mecanismo de notificación: 'portal', 'email', 'ninguno', etc. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  mecanismoNotificacion: string | null;

  @OneToMany(() => Poliza, (p) => p.compania)
  polizas: Poliza[];

  @OneToMany(() => Siniestro, (s) => s.compania)
  siniestros: Siniestro[];

  @OneToMany(() => Reclamo, (r) => r.compania)
  reclamos: Reclamo[];
}
