/**
 * Tests unitarios — RolesGuard
 *
 * Se testea sin NestJS app completa: se construye un ExecutionContext falso
 * con las propiedades mínimas que usa el guard.
 *
 * Ejecutar con: pnpm test
 */
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole, UserStatus } from '@gestion-pas/types';
import { Usuario } from '../../database/entities/usuario.entity';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeContext(perfil: UserRole, requiredRoles: UserRole[] | undefined): ExecutionContext {
  const user = Object.assign(new Usuario(), {
    id: 'usr-001',
    perfil,
    estado: UserStatus.ACTIVO,
    organizador: null,
    productor: null,
    asegurado: null,
  });

  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    // Reflector.getAllAndOverride se llama con (key, [handler, class]) — devolvemos el mock
    // a nivel del reflector, no del contexto, así que no se usa en el contexto en sí
  } as unknown as ExecutionContext;
}

function makeGuard(requiredRoles: UserRole[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

// ── Suite ─────────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  it('permite el acceso cuando el endpoint no tiene @Roles() (requiredRoles = undefined)', () => {
    const guard = makeGuard(undefined);
    const ctx = makeContext(UserRole.PRODUCTOR, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso cuando @Roles() está vacío', () => {
    const guard = makeGuard([]);
    const ctx = makeContext(UserRole.PRODUCTOR, []);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite el acceso cuando el usuario tiene el rol requerido', () => {
    const guard = makeGuard([UserRole.ORGANIZADOR]);
    const ctx = makeContext(UserRole.ORGANIZADOR, [UserRole.ORGANIZADOR]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite al productor cuando el endpoint acepta ORGANIZADOR o PRODUCTOR', () => {
    const guard = makeGuard([UserRole.ORGANIZADOR, UserRole.PRODUCTOR]);
    const ctx = makeContext(UserRole.PRODUCTOR, [UserRole.ORGANIZADOR, UserRole.PRODUCTOR]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lanza 403 cuando el usuario no tiene el rol requerido', () => {
    const guard = makeGuard([UserRole.ORGANIZADOR]);
    const ctx = makeContext(UserRole.PRODUCTOR, [UserRole.ORGANIZADOR]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lanza 403 cuando el asegurado intenta acceder a una ruta de organizador', () => {
    const guard = makeGuard([UserRole.ORGANIZADOR]);
    const ctx = makeContext(UserRole.ASEGURADO, [UserRole.ORGANIZADOR]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('lanza 403 cuando el asegurado intenta acceder a una ruta de productor/organizador', () => {
    const guard = makeGuard([UserRole.ORGANIZADOR, UserRole.PRODUCTOR]);
    const ctx = makeContext(UserRole.ASEGURADO, [UserRole.ORGANIZADOR, UserRole.PRODUCTOR]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('el mensaje del 403 lista los roles requeridos', () => {
    const guard = makeGuard([UserRole.ORGANIZADOR]);
    const ctx = makeContext(UserRole.PRODUCTOR, [UserRole.ORGANIZADOR]);

    try {
      guard.canActivate(ctx);
      fail('Debería haber lanzado ForbiddenException');
    } catch (e) {
      expect((e as ForbiddenException).message).toContain(UserRole.ORGANIZADOR);
    }
  });
});
