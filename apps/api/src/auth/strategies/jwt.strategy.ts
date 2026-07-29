import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Usuario } from '../../database/entities/usuario.entity';
import { UserStatus } from '@gestion-pas/types';

export interface JwtPayload {
  sub: string;       // usuario.id
  role: string;      // usuario.perfil
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev_secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    const user = await this.usuarioRepo.findOne({
      where: { id: payload.sub },
      relations: ['organizador', 'productor', 'asegurado'],
    });
    if (!user || user.estado === UserStatus.INACTIVO) {
      throw new UnauthorizedException('Sesión inválida o usuario inactivo');
    }
    return user;
  }
}
