import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoSiniestro, TipoSiniestro } from '@gestion-pas/types';
import { Asegurado } from './asegurado.entity';
import { BienAsegurado } from './bien-asegurado.entity';
import { Productor } from './productor.entity';
import { CompaniaAseguradora } from './compania-aseguradora.entity';
import { Documento } from './documento.entity';

@Entity('siniestros')
export class Siniestro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoSiniestro })
  tipo: TipoSiniestro;

  @Column({ type: 'date' })
  fechaOcurrencia: Date;

  @Column({ type: 'time', nullable: true })
  horaOcurrencia: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lugarOcurrencia: string | null;

  @Column({ type: 'text', nullable: true })
  relato: string | null;

  @Column({ type: 'text', nullable: true })
  datosTerceros: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSiniestro,
    default: EstadoSiniestro.ABIERTO,
  })
  estado: EstadoSiniestro;

  /** Número de denuncia asignado por la compañía al cargar en su portal */
  @Column({ type: 'varchar', length: 100, nullable: true })
  numeroDenunciaCompania: string | null;

  @ManyToOne(() => Asegurado, (a) => a.siniestros, { nullable: false })
  @JoinColumn({ name: 'asegurado_id' })
  asegurado: Asegurado;

  @ManyToOne(() => BienAsegurado, (b) => b.siniestros, { nullable: false })
  @JoinColumn({ name: 'bien_id' })
  bien: BienAsegurado;

  @ManyToOne(() => Productor, { nullable: false })
  @JoinColumn({ name: 'productor_id' })
  productor: Productor;

  @ManyToOne(() => CompaniaAseguradora, (c) => c.siniestros, { nullable: false })
  @JoinColumn({ name: 'compania_id' })
  compania: CompaniaAseguradora;

  @OneToMany(() => Documento, (d) => d.siniestro)
  documentos: Documento[];
}
