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
import { BienesService } from './bienes.service';
import { CreateBienAseguradoDto } from './dto/create-bien-asegurado.dto';
import { UpdateBienAseguradoDto } from './dto/update-bien-asegurado.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('bienes')
@Controller('bienes')
export class BienesController {
  constructor(private readonly service: BienesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los bienes (filtrado por cartera según rol)' })
  @ApiResponse({ status: 200, description: 'Lista de bienes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@CurrentUser() usuario: Usuario) {
    return this.service.findAll(usuario);
  }

  @Get('asegurado/:aseguradoId')
  @ApiOperation({ summary: 'Listar bienes de un asegurado' })
  @ApiResponse({ status: 200, description: 'Lista de bienes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'El asegurado no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Asegurado no encontrado' })
  findByAsegurado(
    @Param('aseguradoId', ParseUUIDPipe) aseguradoId: string,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.findByAsegurado(aseguradoId, usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un bien asegurado por ID' })
  @ApiResponse({ status: 200, description: 'Bien asegurado encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Bien no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findOne(id, usuario);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Registrar un bien asegurado' })
  @ApiResponse({ status: 201, description: 'Bien asegurado creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Asegurado no encontrado' })
  create(@Body() dto: CreateBienAseguradoDto, @CurrentUser() usuario: Usuario) {
    return this.service.create(dto, usuario);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Actualizar datos de un bien asegurado' })
  @ApiResponse({ status: 200, description: 'Bien actualizado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Bien no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBienAseguradoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.update(id, dto, usuario);
  }
}
