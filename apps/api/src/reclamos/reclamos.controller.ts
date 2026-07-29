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
import { ReclamosService } from './reclamos.service';
import { CreateReclamoDto, UpdateReclamoEstadoDto } from './dto/reclamo.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('reclamos')
@Controller('reclamos')
export class ReclamosController {
  constructor(private readonly service: ReclamosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar reclamos (filtrado por cartera según perfil)' })
  @ApiResponse({ status: 200, description: 'Lista de reclamos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@CurrentUser() usuario: Usuario) {
    return this.service.findAll(usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un reclamo por ID' })
  @ApiResponse({ status: 200, description: 'Reclamo encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Reclamo no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findOne(id, usuario);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Registrar nuevo reclamo' })
  @ApiResponse({ status: 201, description: 'Reclamo creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza o siniestro no encontrado' })
  create(@Body() dto: CreateReclamoDto, @CurrentUser() usuario: Usuario) {
    return this.service.create(dto, usuario);
  }

  @Patch(':id/estado')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Actualizar estado de un reclamo' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Reclamo no encontrado' })
  updateEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReclamoEstadoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.updateEstado(id, dto, usuario);
  }
}
