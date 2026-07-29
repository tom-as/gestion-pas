import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CuotasService } from './cuotas.service';
import { CreateCuotaDto, UpdateCuotaDto } from './dto/cuota.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('cuotas')
@Controller('cuotas')
export class CuotasController {
  constructor(private readonly service: CuotasService) {}

  @Get('vencimientos-proximos')
  @ApiOperation({ summary: 'Cuotas con vencimiento en los próximos N días' })
  @ApiQuery({ name: 'dias', required: false, description: 'Horizonte en días (default 30)' })
  @ApiResponse({ status: 200, description: 'Lista de cuotas PENDIENTE en el horizonte indicado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findVencimientosProximos(
    @Query('dias', new ParseIntPipe({ optional: true })) dias: number = 30,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.findVencimientosProximos(dias, usuario);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cuotas de una póliza' })
  @ApiQuery({ name: 'polizaId', required: true, description: 'UUID de la póliza' })
  @ApiResponse({ status: 200, description: 'Lista de cuotas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  findByPoliza(@Query('polizaId') polizaId: string, @CurrentUser() usuario: Usuario) {
    return this.service.findByPoliza(polizaId, usuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuota por ID' })
  @ApiResponse({ status: 200, description: 'Cuota encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() usuario: Usuario) {
    return this.service.findOne(id, usuario);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Registrar una cuota en una póliza' })
  @ApiResponse({ status: 201, description: 'Cuota creada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  create(@Body() dto: CreateCuotaDto, @CurrentUser() usuario: Usuario) {
    return this.service.create(dto, usuario);
  }

  @Patch(':id')
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Actualizar estado de una cuota (pagada, rechazada, etc.)' })
  @ApiResponse({ status: 200, description: 'Cuota actualizada' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'La póliza no pertenece a tu cartera' })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCuotaDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.update(id, dto, usuario);
  }
}
