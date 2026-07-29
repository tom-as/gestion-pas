import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Usuario } from '../../database/entities/usuario.entity';

/** Inyecta el usuario autenticado en el parámetro del handler */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Usuario => {
    const request = ctx.switchToHttp().getRequest<{ user: Usuario }>();
    return request.user;
  },
);
