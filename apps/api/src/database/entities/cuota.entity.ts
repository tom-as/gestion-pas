import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoCuota } from '@gestion-pas/types';
import { Poliza } from './poliza.entity';
import { Documento } from './documento.entity';

@Entity('cuotas')
export class Cuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  numeroCuota: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  importe: number;

  @Column({ type: 'date' })
  fechaVencimiento: Date;

  @Column({
    type: 'enum',
    enum: EstadoCuota,
    default: EstadoCuota.PENDIENTE,
  })
  estado: EstadoCuota;

  @Column({ type: 'date', nullable: true })
  fechaPagoEfectivo: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  medioPago: string | null;

  @ManyToOne(() => Poliza, (p) => p.cuotas, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza;

  @OneToMany(() => Documento, (d) => d.cuota)
  documentos: Documento[];
}
