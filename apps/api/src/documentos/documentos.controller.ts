import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/documento.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, EntidadDocumento } from '@gestion-pas/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiBearerAuth()
@ApiTags('documentos')
@Controller('documentos')
export class DocumentosController {
  constructor(private readonly service: DocumentosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar documentos de una entidad' })
  @ApiQuery({ name: 'entidad', enum: EntidadDocumento, required: true })
  @ApiQuery({ name: 'entidadId', required: true, description: 'UUID de la entidad' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  @ApiResponse({ status: 400, description: 'entidadId no es un UUID válido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  findByEntidad(
    @Query('entidad') entidad: EntidadDocumento,
    @Query('entidadId') entidadId: string,
  ) {
    if (!entidadId || !UUID_RE.test(entidadId)) {
      throw new BadRequestException('entidadId debe ser un UUID válido');
    }
    return this.service.findByEntidad(entidad, entidadId);
  }

  @Post()
  @Roles(UserRole.ORGANIZADOR, UserRole.PRODUCTOR)
  @ApiOperation({ summary: 'Registrar referencia de documento (URL al object storage)' })
  @ApiResponse({ status: 201, description: 'Documento registrado' })
  @ApiResponse({ status: 400, description: 'DTO inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo organizador y productor pueden subir documentos' })
  @ApiResponse({ status: 404, description: 'Entidad vinculada no encontrada' })
  create(@Body() dto: CreateDocumentoDto) {
    return this.service.create(dto);
  }
}
