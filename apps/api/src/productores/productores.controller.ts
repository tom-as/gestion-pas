import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductoresService } from './productores.service';
import { CreateProductorDto, UpdateProductorDto } from './dto/productor.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('productores')
@Controller('productores')
export class ProductoresController {
  constructor(private readonly service: ProductoresService) {}

  @Get()
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Listar todos los productores de la red (solo organizador)' })
  @ApiResponse({ status: 200, description: 'Lista de productores' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede listar todos los productores' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Obtener un productor por ID' })
  @ApiResponse({ status: 200, description: 'Productor encontrado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo podés ver tu propia ficha' })
  @ApiResponse({ status: 404, description: 'Productor no encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() usuario: Usuario,
  ) {
    // El productor solo puede ver su propia ficha — lanzar 403 estándar, no 200 con mensaje
    if (usuario.perfil === UserRole.PRODUCTOR && usuario.productor?.id !== id) {
      throw new ForbiddenException('Solo podés ver tu propia ficha');
    }
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Incorporar nuevo productor a la red (solo organizador)' })
  @ApiResponse({ status: 201, description: 'Productor creado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede crear productores' })
  @ApiResponse({ status: 409, description: 'DNI/CUIL ya registrado' })
  create(@Body() dto: CreateProductorDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Actualizar datos de un productor (solo organizador)' })
  @ApiResponse({ status: 200, description: 'Productor actualizado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede actualizar productores' })
  @ApiResponse({ status: 404, description: 'Productor no encontrado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductorDto) {
    return this.service.update(id, dto);
  }
}
