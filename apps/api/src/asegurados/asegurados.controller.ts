import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AseguradosService, AseguradoStats } from './asegurados.service';
import { CreateAseguradoDto } from './dto/create-asegurado.dto';
import { UpdateAseguradoDto } from './dto/update-asegurado.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('asegurados')
@Controller('asegurados')
export class AseguradosController {
  constructor(private readonly service: AseguradosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar asegurados (filtrado por cartera según perfil)' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o DNI/CUIL' })
  @ApiResponse({ status: 200, description: 'Lista de asegurados' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll(@Query('search') search: string | undefined, @CurrentUser() usuario: Usuario) {
    return this.service.findAll(usuario, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un asegurado por ID' })
  @ApiResponse({ status: 200, description: 'Asegurado encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'El asegurado no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Asegurado no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findOne(id, usuario);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estadísticas de pólizas y cuotas de un asegurado' })
  @ApiResponse({ status: 200, description: 'Stats del asegurado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Asegurado no encontrado' })
  getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ): Promise<AseguradoStats> {
    return this.service.getStats(id, usuario);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Crear asegurado' })
  @ApiResponse({ status: 201, description: 'Asegurado creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Intento de crear en cartera ajena' })
  @ApiResponse({ status: 404, description: 'Productor no encontrado' })
  @ApiResponse({ status: 409, description: 'DNI/CUIL ya registrado en el sistema' })
  create(@Body() dto: CreateAseguradoDto, @CurrentUser() usuario: Usuario) {
    return this.service.create(dto, usuario);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Actualizar datos de un asegurado' })
  @ApiResponse({ status: 200, description: 'Asegurado actualizado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'El asegurado no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Asegurado o productor no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAseguradoDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.update(id, dto, usuario);
  }
}
