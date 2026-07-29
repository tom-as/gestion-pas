/**
 * Tests unitarios — AuthService
 *
 * Se testea sin base de datos real: los repositorios TypeORM y JwtService
 * se reemplazan por mocks completos.
 *
 * Ejecutar con: pnpm test
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { Usuario } from '../database/entities/usuario.entity';
import { Organizador } from '../database/entities/organizador.entity';
import { Productor } from '../database/entities/productor.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { UserRole, UserStatus } from '@gestion-pas/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<Usuario> = {}): Usuario {
  const u = new Usuario();
  u.id = 'user-uuid-1';
  u.identificadorAcceso = 'florencia@gestionpas.com.ar';
  // Hash real de 'admin1234' con bcryptjs (sincrono — solo en tests)
  u.credencial = bcrypt.hashSync('admin1234', 10);
  u.perfil = UserRole.ORGANIZADOR;
  u.estado = UserStatus.ACTIVO;
  u.ultimaSesion = null;
  u.organizador = null;
  u.productor = null;
  u.asegurado = null;
  return Object.assign(u, overrides);
}

function mockRepo(methods: Partial<Record<string, jest.Mock>> = {}): object {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    ...methods,
  };
}

// ── Suite ─────────────────────────────────────────────────────────────────

describe('AuthService — login()', () => {
  let service: AuthService;
  let usuarioRepo: ReturnType<typeof mockRepo> & { findOne: jest.Mock; update: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usuarioRepo = mockRepo() as ReturnType<typeof mockRepo> & {
      findOne: jest.Mock;
      update: jest.Mock;
    };
    jwtService = { sign: jest.fn().mockReturnValue('fake.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepo },
        { provide: getRepositoryToken(Organizador), useValue: mockRepo() },
        { provide: getRepositoryToken(Productor), useValue: mockRepo() },
        { provide: getRepositoryToken(Asegurado), useValue: mockRepo() },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('happy path — devuelve accessToken y perfil cuando las credenciales son correctas', async () => {
    const user = makeUser();
    (usuarioRepo.findOne as jest.Mock).mockResolvedValue(user);
    (usuarioRepo.update as jest.Mock).mockResolvedValue(undefined);

    const result = await service.login({
      identificadorAcceso: 'florencia@gestionpas.com.ar',
      password: 'admin1234',
    });

    expect(result.accessToken).toBe('fake.jwt.token');
    expect(result.perfil).toBe(UserRole.ORGANIZADOR);
    expect(result.id).toBe('user-uuid-1');
    expect(result.aseguradoId).toBeNull();
    expect(result.organizadorId).toBeNull();
  });

  it('401 cuando el usuario no existe en el sistema', async () => {
    (usuarioRepo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({ identificadorAcceso: 'noexiste@x.com', password: 'cualquiera' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('401 cuando la contraseña es incorrecta', async () => {
    const user = makeUser();
    (usuarioRepo.findOne as jest.Mock).mockResolvedValue(user);

    await expect(
      service.login({ identificadorAcceso: 'florencia@gestionpas.com.ar', password: 'wrongpass' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('401 cuando el usuario está inactivo, aunque la contraseña sea correcta', async () => {
    const user = makeUser({ estado: UserStatus.INACTIVO });
    (usuarioRepo.findOne as jest.Mock).mockResolvedValue(user);

    await expect(
      service.login({ identificadorAcceso: 'florencia@gestionpas.com.ar', password: 'admin1234' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('los mensajes de error de credenciales inválidas no revelan si el usuario existe', async () => {
    // Usuario inexistente
    (usuarioRepo.findOne as jest.Mock).mockResolvedValue(null);
    const errNoExiste = await service.login({ identificadorAcceso: 'x@x.com', password: 'p' })
      .catch((e: UnauthorizedException) => e);

    // Usuario con contraseña incorrecta
    (usuarioRepo.findOne as jest.Mock).mockResolvedValue(makeUser());
    const errWrongPass = await service.login({ identificadorAcceso: 'florencia@gestionpas.com.ar', password: 'wrong' })
      .catch((e: UnauthorizedException) => e);

    // Ambos mensajes deben ser idénticos (no revelar si el email existe)
    expect((errNoExiste as UnauthorizedException).message).toBe(
      (errWrongPass as UnauthorizedException).message,
    );
  });
});
