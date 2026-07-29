import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoPoliza, PeriodicidadRefacturacion } from '@gestion-pas/types';
import { Asegurado } from './asegurado.entity';
import { BienAsegurado } from './bien-asegurado.entity';
import { Productor } from './productor.entity';
import { CompaniaAseguradora } from './compania-aseguradora.entity';
import { Endoso } from './endoso.entity';
import { Cuota } from './cuota.entity';
import { Siniestro } from './siniestro.entity';
import { Documento } from './documento.entity';

@Entity('polizas')
export class Poliza {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Número de póliza emitido por la compañía aseguradora */
  @Column({ type: 'varchar', length: 100 })
  numeroPoliza: string;

  @Column({ type: 'date' })
  vigenciaInicio: Date;

  @Column({ type: 'date' })
  vigenciaFin: Date;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  importeCuotaVigente: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modalidadPago: string | null;

  @Column({
    type: 'enum',
    enum: EstadoPoliza,
    default: EstadoPoliza.ACTIVA,
  })
  estado: EstadoPoliza;

  @Column({
    type: 'enum',
    enum: PeriodicidadRefacturacion,
    nullable: true,
  })
  periodicidadRefacturacion: PeriodicidadRefacturacion | null;

  @ManyToOne(() => Asegurado, (a) => a.polizas, { nullable: false })
  @JoinColumn({ name: 'asegurado_id' })
  asegurado: Asegurado;

  @ManyToOne(() => BienAsegurado, (b) => b.polizas, { nullable: false })
  @JoinColumn({ name: 'bien_id' })
  bien: BienAsegurado;

  @ManyToOne(() => Productor, (p) => p.polizas, { nullable: false })
  @JoinColumn({ name: 'productor_id' })
  productor: Productor;

  @ManyToOne(() => CompaniaAseguradora, (c) => c.polizas, { nullable: false })
  @JoinColumn({ name: 'compania_id' })
  compania: CompaniaAseguradora;

  @OneToMany(() => Endoso, (e) => e.poliza)
  endosos: Endoso[];

  @OneToMany(() => Cuota, (c) => c.poliza)
  cuotas: Cuota[];

  @OneToMany(() => Siniestro, (s) => s.compania)
  siniestros: Siniestro[];

  @OneToMany(() => Documento, (d) => d.poliza)
  documentos: Documento[];
}
