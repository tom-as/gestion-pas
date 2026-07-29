import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntidadDocumento, TipoDocumento } from '@gestion-pas/types';
import { Asegurado } from './asegurado.entity';
import { BienAsegurado } from './bien-asegurado.entity';
import { Poliza } from './poliza.entity';
import { Cuota } from './cuota.entity';
import { Siniestro } from './siniestro.entity';
import { Reclamo } from './reclamo.entity';

/**
 * Documento siempre vinculado a exactamente una entidad de negocio.
 * El archivo binario se almacena en object storage (S3/GCS);
 * aquí solo se guarda la URL/referencia.
 */
@Entity('documentos')
export class Documento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoDocumento })
  tipo: TipoDocumento;

  /** Indica qué tipo de entidad tiene vinculada este documento */
  @Column({ type: 'enum', enum: EntidadDocumento })
  entidadVinculada: EntidadDocumento;

  /** Descripción del trámite o momento del proceso al que corresponde */
  @Column({ type: 'varchar', length: 300, nullable: true })
  tramiteContexto: string | null;

  /** URL al archivo en object storage */
  @Column({ type: 'varchar', length: 1000 })
  archivoUrl: string;

  @CreateDateColumn()
  fechaIncorporacion: Date;

  // ── FK polimórfica (solo una estará poblada por fila) ──────────────

  @ManyToOne(() => Asegurado, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asegurado_id' })
  asegurado: Asegurado | null;

  @ManyToOne(() => BienAsegurado, (b) => b.documentos, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bien_id' })
  bienAsegurado: BienAsegurado | null;

  @ManyToOne(() => Poliza, (p) => p.documentos, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'poliza_id' })
  poliza: Poliza | null;

  @ManyToOne(() => Cuota, (c) => c.documentos, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cuota_id' })
  cuota: Cuota | null;

  @ManyToOne(() => Siniestro, (s) => s.documentos, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'siniestro_id' })
  siniestro: Siniestro | null;

  @ManyToOne(() => Reclamo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reclamo_id' })
  reclamo: Reclamo | null;
}
