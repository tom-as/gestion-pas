import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('notificaciones')
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener notificaciones del usuario autenticado' })
  findAll(@CurrentUser() usuario: Usuario) {
    return this.service.findAll(usuario);
  }

  @Get('no-leidas')
  @ApiOperation({ summary: 'Obtener solo notificaciones no leídas' })
  findNoLeidas(@CurrentUser() usuario: Usuario) {
    return this.service.findNoLeidas(usuario);
  }

  @Patch('leer-todas')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  marcarTodasLeidas(@CurrentUser() usuario: Usuario) {
    return this.service.marcarTodasLeidas(usuario);
  }

  @Patch(':id/leer')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  marcarLeida(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.marcarLeida(id, usuario);
  }
}
