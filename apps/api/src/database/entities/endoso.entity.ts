import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Poliza } from './poliza.entity';

@Entity('endosos')
export class Endoso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Número de endoso emitido por la compañía */
  @Column({ type: 'varchar', length: 100 })
  numeroEndoso: string;

  /** Descripción del tipo de modificación: refacturación, cambio de bien, etc. */
  @Column({ type: 'varchar', length: 200 })
  tipoModificacion: string;

  /** Nuevo importe de cuota tras la modificación (opcional) */
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  importeActualizado: number | null;

  /** Nueva suma asegurada tras la modificación (opcional) */
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  sumaAseguradaActualizada: number | null;

  @Column({ type: 'date' })
  fechaEmision: Date;

  @ManyToOne(() => Poliza, (p) => p.endosos, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza;
}
