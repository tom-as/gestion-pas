import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoReclamo, TipoReclamo } from '@gestion-pas/types';

export class CreateReclamoDto {
  @ApiProperty({ enum: TipoReclamo })
  @IsEnum(TipoReclamo)
  tipo: TipoReclamo;

  @ApiPropertyOptional({ example: 'La compañía no reconoce el siniestro declarado…' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: '2024-07-01' })
  @IsDateString()
  fechaApertura: string;

  @ApiProperty({ description: 'UUID del asegurado' })
  @IsUUID()
  aseguradoId: string;

  @ApiProperty({ description: 'UUID del productor' })
  @IsUUID()
  productorId: string;

  @ApiPropertyOptional({ description: 'UUID de la compañía aseguradora (opcional)' })
  @IsUUID()
  @IsOptional()
  companiaId?: string;
}

export class UpdateReclamoEstadoDto {
  @ApiProperty({ enum: EstadoReclamo })
  @IsEnum(EstadoReclamo)
  estado: EstadoReclamo;
}
