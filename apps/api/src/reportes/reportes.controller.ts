import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  EstadoPoliza,
  EstadoReclamo,
  EstadoSiniestro,
  TipoReclamo,
  UserRole,
} from '@gestion-pas/types';
import { Usuario } from '../database/entities/usuario.entity';

@ApiBearerAuth()
@ApiTags('reportes')
@Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('cartera-asegurados')
  @ApiOperation({ summary: 'R1 — Cartera de asegurados con productor asignado' })
  @ApiResponse({ status: 200, description: 'Lista de asegurados con productor' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  carteraAsegurados(@CurrentUser() usuario: Usuario) {
    return this.service.carteraAsegurados(usuario);
  }

  @Get('vencimientos-proximos')
  @ApiOperation({ summary: 'R2 — Cuotas con vencimiento en los próximos N días' })
  @ApiQuery({ name: 'dias', required: false, description: 'Horizonte en días (default 30)' })
  @ApiResponse({ status: 200, description: 'Cuotas PENDIENTE próximas a vencer (strings ISO)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  vencimientosProximos(
    @Query('dias', new ParseIntPipe({ optional: true })) dias: number = 30,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.vencimientosProximos(dias, usuario);
  }

  @Get('siniestros')
  @ApiOperation({ summary: 'R3 — Siniestros agrupados por estado' })
  @ApiQuery({ name: 'estado', enum: EstadoSiniestro, required: false })
  @ApiResponse({ status: 200, description: 'Siniestros filtrados por estado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  siniestros(
    @Query('estado') estado: EstadoSiniestro | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.siniestros(estado, usuario);
  }

  @Get('reclamos')
  @ApiOperation({ summary: 'R4 — Reclamos con filtros por estado / tipo / compañía' })
  @ApiQuery({ name: 'estado', enum: EstadoReclamo, required: false })
  @ApiQuery({ name: 'tipo', enum: TipoReclamo, required: false })
  @ApiQuery({ name: 'companiaId', required: false, description: 'UUID de la compañía' })
  @ApiResponse({ status: 200, description: 'Reclamos filtrados' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  reclamos(
    @Query('estado') estado: EstadoReclamo | undefined,
    @Query('tipo') tipo: TipoReclamo | undefined,
    @Query('companiaId') companiaId: string | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.reclamos(estado, tipo, companiaId, usuario);
  }

  @Get('polizas')
  @ApiOperation({ summary: 'R5 — Pólizas por estado o próximas a vencer' })
  @ApiQuery({ name: 'estado', enum: EstadoPoliza, required: false })
  @ApiQuery({ name: 'vencenEnDias', required: false, description: 'Pólizas que vencen en N días' })
  @ApiResponse({ status: 200, description: 'Pólizas filtradas (auto-suspensión aplicada antes de leer)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  polizas(
    @Query('estado') estado: EstadoPoliza | undefined,
    @Query('vencenEnDias', new ParseIntPipe({ optional: true })) vencenEnDias: number | undefined,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.service.polizas(estado, vencenEnDias, usuario);
  }

  @Get('comisiones')
  @ApiOperation({ summary: 'R6 — Pólizas activas e importe de cuotas por productor' })
  @ApiResponse({ status: 200, description: 'Comisiones por productor' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  comisiones(@CurrentUser() usuario: Usuario) {
    return this.service.comisiones(usuario);
  }

  @Get('datos-incompletos')
  @ApiOperation({ summary: 'R7 — Bienes asegurados con campos clave vacíos (calidad de datos)' })
  @ApiResponse({ status: 200, description: 'Bienes con datos incompletos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor acceden a reportes' })
  datosIncompletos(@CurrentUser() usuario: Usuario) {
    return this.service.datosIncompletos(usuario);
  }
}
