import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SiniestrosService } from './siniestros.service';
import { CreateSiniestroDto, UpdateSiniestroEstadoDto } from './dto/siniestro.dto';
import { CreateComentarioDto } from '../notificaciones/dto/notificacion.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('siniestros')
@Controller('siniestros')
export class SiniestrosController {
  constructor(private readonly service: SiniestrosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar siniestros (filtrado por cartera según perfil)' })
  @ApiResponse({ status: 200, description: 'Lista de siniestros' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@CurrentUser() usuario: Usuario) {
    return this.service.findAll(usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un siniestro por ID' })
  @ApiResponse({ status: 200, description: 'Siniestro encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Siniestro no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findOne(id, usuario);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR, UserRole.ASEGURADO)
  @ApiOperation({ summary: 'Registrar nuevo siniestro' })
  @ApiResponse({ status: 201, description: 'Siniestro creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza o asegurado no encontrado' })
  create(@Body() dto: CreateSiniestroDto, @CurrentUser() usuario: Usuario) {
    return this.service.create(dto, usuario);
  }

  @Patch(':id/estado')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Actualizar estado de un siniestro' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Siniestro no encontrado' })
  updateEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSiniestroEstadoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.updateEstado(id, dto, usuario);
  }

  /* ── Comentarios ─────────────────────────────────────────── */

  @Get(':id/comentarios')
  @ApiOperation({ summary: 'Listar comentarios de un siniestro' })
  @ApiResponse({ status: 200, description: 'Lista de comentarios' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Siniestro no encontrado' })
  findComentarios(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.findComentarios(id, usuario);
  }

  @Post(':id/comentarios')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR, UserRole.ASEGURADO)
  @ApiOperation({ summary: 'Agregar comentario a un siniestro' })
  @ApiResponse({ status: 201, description: 'Comentario creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Siniestro no encontrado' })
  addComentario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateComentarioDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.addComentario(id, dto, usuario);
  }
}
