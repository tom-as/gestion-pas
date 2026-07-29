/**
 * Tests unitarios — AseguradosService
 *
 * Se testea sin base de datos real: los repositorios TypeORM se reemplazan
 * por mocks completos.
 *
 * Ejecutar con: pnpm test
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AseguradosService } from './asegurados.service';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { UserRole, UserStatus } from '@gestion-pas/types';

// ── Helpers ────────────────────────────────────────────────────────────────

function mockRepo(methods: Partial<Record<string, jest.Mock>> = {}): object {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    ...methods,
  };
}

function makeUsuario(perfil: UserRole, overrides: Partial<Usuario> = {}): Usuario {
  const u = new Usuario();
  u.id = 'usr-001';
  u.identificadorAcceso = 'test@example.com';
  u.credencial = 'hashed';
  u.perfil = perfil;
  u.estado = UserStatus.ACTIVO;
  u.ultimaSesion = null;
  u.organizador = null;
  u.asegurado = null;
  return Object.assign(u, overrides);
}

function makeProductor(id: string): Productor {
  const p = new Productor();
  p.id = id;
  return p;
}

// ── Suite ─────────────────────────────────────────────────────────────────

describe('AseguradosService', () => {
  let service: AseguradosService;
  let aseguradoRepo: Record<string, jest.Mock>;
  let productorRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    aseguradoRepo = mockRepo() as Record<string, jest.Mock>;
    productorRepo = mockRepo() as Record<string, jest.Mock>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AseguradosService,
        { provide: getRepositoryToken(Asegurado), useValue: aseguradoRepo },
        { provide: getRepositoryToken(Productor), useValue: productorRepo },
      ],
    }).compile();

    service = module.get<AseguradosService>(AseguradosService);
  });

  // ── create() ────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = {
      nombre: 'Carlos Martínez',
      dniCuil: '20123456789',
      productorId: 'prod-uuid-1',
    };

    it('409 si el DNI/CUIL ya está registrado', async () => {
      aseguradoRepo.findOne.mockResolvedValue(new Asegurado()); // DNI existe

      await expect(
        service.create(dto, makeUsuario(UserRole.ORGANIZADOR)),
      ).rejects.toThrow(ConflictException);
    });

    it('404 si el productor indicado no existe', async () => {
      aseguradoRepo.findOne.mockResolvedValue(null); // DNI libre
      productorRepo.findOne.mockResolvedValue(null);  // productor no existe

      await expect(
        service.create(dto, makeUsuario(UserRole.ORGANIZADOR)),
      ).rejects.toThrow(NotFoundException);
    });

    it('403 si el productor intenta crear en cartera ajena', async () => {
      const productor = makeProductor('prod-uuid-1');
      // El usuario productor tiene productor.id diferente al dto.productorId
      const usuario = makeUsuario(UserRole.PRODUCTOR, {
        productor: makeProductor('prod-uuid-OTRO'),
      });

      aseguradoRepo.findOne.mockResolvedValue(null); // DNI libre
      productorRepo.findOne.mockResolvedValue(productor);

      await expect(service.create(dto, usuario)).rejects.toThrow(ForbiddenException);
    });

    it('crea el asegurado si el productor actúa en su propia cartera', async () => {
      const productor = makeProductor('prod-uuid-1');
      const usuario = makeUsuario(UserRole.PRODUCTOR, { productor });

      const nuevoAsegurado = Object.assign(new Asegurado(), { id: 'new-uuid', ...dto });

      aseguradoRepo.findOne.mockResolvedValue(null); // DNI libre
      productorRepo.findOne.mockResolvedValue(productor);
      aseguradoRepo.create.mockReturnValue(nuevoAsegurado);
      aseguradoRepo.save.mockResolvedValue(nuevoAsegurado);

      const result = await service.create(dto, usuario);
      expect(result.id).toBe('new-uuid');
      expect(aseguradoRepo.save).toHaveBeenCalledTimes(1);
    });

    it('el organizador puede crear asegurados en cualquier cartera', async () => {
      const productor = makeProductor('prod-uuid-1');
      const usuario = makeUsuario(UserRole.ORGANIZADOR);
      const nuevoAsegurado = Object.assign(new Asegurado(), { id: 'new-uuid', ...dto });

      aseguradoRepo.findOne.mockResolvedValue(null);
      productorRepo.findOne.mockResolvedValue(productor);
      aseguradoRepo.create.mockReturnValue(nuevoAsegurado);
      aseguradoRepo.save.mockResolvedValue(nuevoAsegurado);

      const result = await service.create(dto, usuario);
      expect(result.id).toBe('new-uuid');
    });
  });

  // ── findAll() — filtro de cartera ───────────────────────────────────────

  describe('findAll() — filtro de cartera', () => {
    it('el organizador no aplica filtro de productor en la query', async () => {
      const orgUsuario = makeUsuario(UserRole.ORGANIZADOR);
      aseguradoRepo.find.mockResolvedValue([]);

      await service.findAll(orgUsuario);

      // La query no debe incluir un where con productor.id
      const callArg = aseguradoRepo.find.mock.calls[0][0] as { where: unknown };
      expect(callArg.where).not.toMatchObject({ productor: expect.anything() });
    });

    it('el productor aplica filtro de cartera (productor.id) en la query', async () => {
      const productor = makeProductor('prod-uuid-99');
      const prodUsuario = makeUsuario(UserRole.PRODUCTOR, { productor });
      aseguradoRepo.find.mockResolvedValue([]);

      await service.findAll(prodUsuario);

      const callArg = aseguradoRepo.find.mock.calls[0][0] as { where: { productor?: { id: string } } };
      expect(callArg.where).toMatchObject({ productor: { id: 'prod-uuid-99' } });
    });

    it('incluye relación productor en todos los casos', async () => {
      const orgUsuario = makeUsuario(UserRole.ORGANIZADOR);
      aseguradoRepo.find.mockResolvedValue([]);

      await service.findAll(orgUsuario);

      const callArg = aseguradoRepo.find.mock.calls[0][0] as { relations: string[] };
      expect(callArg.relations).toContain('productor');
    });
  });
});
