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
import { PolizasService } from './polizas.service';
import { CreatePolizaDto, UpdatePolizaDto, CreateEndosoDto } from './dto/poliza.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('pólizas')
@Controller('polizas')
export class PolizasController {
  constructor(private readonly service: PolizasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pólizas (filtrado por cartera según perfil)' })
  @ApiResponse({ status: 200, description: 'Lista de pólizas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@CurrentUser() usuario: Usuario) {
    return this.service.findAll(usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una póliza por ID' })
  @ApiResponse({ status: 200, description: 'Póliza encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findOne(id, usuario);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Registrar nueva póliza' })
  @ApiResponse({ status: 201, description: 'Póliza creada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Intento de crear póliza en cartera ajena' })
  @ApiResponse({ status: 404, description: 'Asegurado, bien, productor o compañía no encontrada' })
  create(@Body() dto: CreatePolizaDto, @CurrentUser() usuario: Usuario) {
    return this.service.create(dto, usuario);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Actualizar estado o importe de una póliza' })
  @ApiResponse({ status: 200, description: 'Póliza actualizada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePolizaDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.update(id, dto, usuario);
  }

  @Post(':id/endosos')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Registrar un endoso en una póliza' })
  @ApiResponse({ status: 201, description: 'Endoso registrado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  createEndoso(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEndosoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.createEndoso(id, dto, usuario);
  }

  @Get(':id/endosos')
  @ApiOperation({ summary: 'Obtener historial de endosos de una póliza' })
  @ApiResponse({ status: 200, description: 'Lista de endosos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  findEndosos(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findEndosos(id, usuario);
  }
}
