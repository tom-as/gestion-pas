import { Controller, Get, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@gestion-pas/types';

/** Helper que envía una respuesta CSV con los headers correctos */
function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.end('\uFEFF' + csv); // BOM UTF-8 para compatibilidad con Excel
}

@ApiBearerAuth()
@ApiTags('export')
@Roles(UserRole.ORGANIZADOR)
@Controller('export')
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('asegurados.csv')
  @ApiOperation({ summary: 'Exportar asegurados como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async asegurados(@Res() res: Response) {
    sendCsv(res, 'asegurados.csv', await this.service.exportAsegurados());
  }

  @Get('productores.csv')
  @ApiOperation({ summary: 'Exportar productores como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async productores(@Res() res: Response) {
    sendCsv(res, 'productores.csv', await this.service.exportProductores());
  }

  @Get('companias.csv')
  @ApiOperation({ summary: 'Exportar compañías como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async companias(@Res() res: Response) {
    sendCsv(res, 'companias.csv', await this.service.exportCompanias());
  }

  @Get('bienes.csv')
  @ApiOperation({ summary: 'Exportar bienes asegurados como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async bienes(@Res() res: Response) {
    sendCsv(res, 'bienes.csv', await this.service.exportBienes());
  }

  @Get('polizas.csv')
  @ApiOperation({ summary: 'Exportar pólizas como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async polizas(@Res() res: Response) {
    sendCsv(res, 'polizas.csv', await this.service.exportPolizas());
  }

  @Get('endosos.csv')
  @ApiOperation({ summary: 'Exportar endosos como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async endosos(@Res() res: Response) {
    sendCsv(res, 'endosos.csv', await this.service.exportEndosos());
  }

  @Get('cuotas.csv')
  @ApiOperation({ summary: 'Exportar cuotas como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async cuotas(@Res() res: Response) {
    sendCsv(res, 'cuotas.csv', await this.service.exportCuotas());
  }

  @Get('siniestros.csv')
  @ApiOperation({ summary: 'Exportar siniestros como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async siniestros(@Res() res: Response) {
    sendCsv(res, 'siniestros.csv', await this.service.exportSiniestros());
  }

  @Get('reclamos.csv')
  @ApiOperation({ summary: 'Exportar reclamos como CSV' })
  @ApiResponse({ status: 200, description: 'text/csv' })
  async reclamos(@Res() res: Response) {
    sendCsv(res, 'reclamos.csv', await this.service.exportReclamos());
  }
}
