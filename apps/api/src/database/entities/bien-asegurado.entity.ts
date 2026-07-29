import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoBien, UsoVehiculo } from '@gestion-pas/types';
import { Asegurado } from './asegurado.entity';
import { Poliza } from './poliza.entity';
import { Siniestro } from './siniestro.entity';
import { Documento } from './documento.entity';

@Entity('bienes_asegurados')
export class BienAsegurado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoBien })
  tipo: TipoBien;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  sumaAsegurada: number | null;

  // ── Atributos ramo automotor ──────────────────────────────────────

  /** Patente — identificador primario del vehículo, permite consultar versión exacta */
  @Column({ type: 'varchar', length: 20, nullable: true })
  patente: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modelo: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  version: string | null;

  @Column({ type: 'int', nullable: true })
  anioFabricacion: number | null;

  @Column({ type: 'enum', enum: UsoVehiculo, nullable: true })
  uso: UsoVehiculo | null;

  /** GNC instalado — impacta en la prima mensual */
  @Column({ type: 'boolean', nullable: true })
  tieneGnc: boolean | null;

  /** Descripción textual de accesorios no originales declarados */
  @Column({ type: 'text', nullable: true })
  accesoriosDeclarados: string | null;

  @ManyToOne(() => Asegurado, (a) => a.bienes, { nullable: false })
  @JoinColumn({ name: 'asegurado_id' })
  asegurado: Asegurado;

  @OneToMany(() => Poliza, (p) => p.bien)
  polizas: Poliza[];

  @OneToMany(() => Siniestro, (s) => s.bien)
  siniestros: Siniestro[];

  /** Documentos vinculados (ej: facturas de accesorios) */
  @OneToMany(() => Documento, (d) => d.bienAsegurado)
  documentos: Documento[];
}
