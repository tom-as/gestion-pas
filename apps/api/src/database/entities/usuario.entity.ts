import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '@gestion-pas/types';
import { Organizador } from './organizador.entity';
import { Productor } from './productor.entity';
import { Asegurado } from './asegurado.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Identificador de acceso (email o username) — único en el sistema */
  @Column({ type: 'varchar', length: 200, unique: true })
  identificadorAcceso: string;

  /** Contraseña hasheada con bcrypt */
  @Column({ type: 'varchar', length: 200 })
  credencial: string;

  @Column({ type: 'enum', enum: UserRole })
  perfil: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVO,
  })
  estado: UserStatus;

  @UpdateDateColumn({ nullable: true })
  ultimaSesion: Date | null;

  // ── Referencias a la entidad de negocio (solo una estará poblada) ──

  @ManyToOne(() => Organizador, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizador_id' })
  organizador: Organizador | null;

  @ManyToOne(() => Productor, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productor_id' })
  productor: Productor | null;

  @ManyToOne(() => Asegurado, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asegurado_id' })
  asegurado: Asegurado | null;
}
