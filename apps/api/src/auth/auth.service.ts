import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../database/entities/usuario.entity';
import { Organizador } from '../database/entities/organizador.entity';
import { Productor } from '../database/entities/productor.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { UserRole, UserStatus } from '@gestion-pas/types';
import { LoginDto } from './dto/login.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenResponse {
  accessToken: string;
  perfil: string;
  id: string;
  /** Poblado solo cuando perfil === ASEGURADO */
  aseguradoId: string | null;
  /** Poblado solo cuando perfil === ORGANIZADOR */
  organizadorId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Organizador)
    private readonly organizadorRepo: Repository<Organizador>,
    @InjectRepository(Productor)
    private readonly productorRepo: Repository<Productor>,
    @InjectRepository(Asegurado)
    private readonly aseguradoRepo: Repository<Asegurado>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<TokenResponse> {
    // Carga todas las relaciones necesarias en una única query
    const user = await this.usuarioRepo.findOne({
      where: { identificadorAcceso: dto.identificadorAcceso },
      relations: ['asegurado', 'organizador'],
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (user.estado === UserStatus.INACTIVO) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.credencial);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas');

    // Actualizar última sesión (fire-and-forget — no bloquea la respuesta)
    void this.usuarioRepo.update(user.id, { ultimaSesion: new Date() });

    const payload: JwtPayload = { sub: user.id, role: user.perfil };
    return {
      accessToken: this.jwtService.sign(payload),
      perfil: user.perfil,
      id: user.id,
      aseguradoId: user.asegurado?.id ?? null,
      organizadorId: user.organizador?.id ?? null,
    };
  }

  async createUsuario(dto: CreateUsuarioDto, creador: Usuario): Promise<Usuario> {
    // Solo el organizador puede crear usuarios
    if (creador.perfil !== UserRole.ORGANIZADOR) {
      throw new ForbiddenException('Solo los organizadores pueden crear usuarios');
    }

    const exists = await this.usuarioRepo.findOne({
      where: { identificadorAcceso: dto.identificadorAcceso },
    });
    if (exists) {
      throw new ConflictException(`El identificador '${dto.identificadorAcceso}' ya está en uso`);
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepo.create({
      identificadorAcceso: dto.identificadorAcceso,
      credencial: hashed,
      perfil: dto.perfil,
      estado: UserStatus.ACTIVO,
    });

    // Asociar a la entidad de negocio si se proporcionó un ID
    if (dto.entidadId) {
      await this.linkEntidad(usuario, dto.perfil, dto.entidadId);
    }

    return this.usuarioRepo.save(usuario);
  }

  async updateStatus(id: string, estado: UserStatus, solicitante: Usuario): Promise<Usuario> {
    if (solicitante.perfil !== UserRole.ORGANIZADOR) {
      throw new ForbiddenException('Solo los organizadores pueden modificar el estado de usuarios');
    }

    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    await this.usuarioRepo.update(id, { estado });
    // Recargar desde DB para devolver el estado persistido real, no un spread optimista
    return this.usuarioRepo.findOneOrFail({ where: { id } });
  }

  // ── helpers ────────────────────────────────────────────────────────

  private async linkEntidad(
    usuario: Usuario,
    perfil: UserRole,
    entidadId: string,
  ): Promise<void> {
    if (perfil === UserRole.ORGANIZADOR) {
      const org = await this.organizadorRepo.findOne({ where: { id: entidadId } });
      if (!org) throw new NotFoundException(`Organizador ${entidadId} no encontrado`);
      usuario.organizador = org;
    } else if (perfil === UserRole.PRODUCTOR) {
      const prod = await this.productorRepo.findOne({ where: { id: entidadId } });
      if (!prod) throw new NotFoundException(`Productor ${entidadId} no encontrado`);
      usuario.productor = prod;
    } else if (perfil === UserRole.ASEGURADO) {
      const aseg = await this.aseguradoRepo.findOne({ where: { id: entidadId } });
      if (!aseg) throw new NotFoundException(`Asegurado ${entidadId} no encontrado`);
      usuario.asegurado = aseg;
    }
  }
}
