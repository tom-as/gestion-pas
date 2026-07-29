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
import { CompaniasService } from './companias.service';
import { CreateCompaniaDto, UpdateCompaniaDto } from './dto/compania.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@gestion-pas/types';

@ApiBearerAuth()
@ApiTags('compañías')
@Controller('companias')
export class CompaniasController {
  constructor(private readonly service: CompaniasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar compañías aseguradoras' })
  @ApiResponse({ status: 200, description: 'Lista de compañías' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una compañía por ID' })
  @ApiResponse({ status: 200, description: 'Compañía encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Registrar nueva compañía aseguradora (solo organizador)' })
  @ApiResponse({ status: 201, description: 'Compañía creada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede crear compañías' })
  @ApiResponse({ status: 409, description: 'CUIT o nombre ya registrado' })
  create(@Body() dto: CreateCompaniaDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR)
  @ApiOperation({ summary: 'Actualizar reglas de negocio de una compañía (solo organizador)' })
  @ApiResponse({ status: 200, description: 'Compañía actualizada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo el organizador puede actualizar compañías' })
  @ApiResponse({ status: 404, description: 'Compañía no encontrada' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCompaniaDto) {
    return this.service.update(id, dto);
  }
}
