import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPoliza, PeriodicidadRefacturacion } from '@gestion-pas/types';

export class CreatePolizaDto {
  @ApiProperty({ example: 'POL-2024-001' })
  @IsString()
  numeroPoliza: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  vigenciaInicio: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  vigenciaFin: string;

  @ApiProperty({ example: 12500.5 })
  @IsNumber()
  @Min(0)
  importeCuotaVigente: number;

  @ApiPropertyOptional({ example: 'débito automático' })
  @IsString()
  @IsOptional()
  modalidadPago?: string;

  @ApiPropertyOptional({ enum: EstadoPoliza, default: EstadoPoliza.ACTIVA })
  @IsEnum(EstadoPoliza)
  @IsOptional()
  estado?: EstadoPoliza;

  @ApiPropertyOptional({ enum: PeriodicidadRefacturacion })
  @IsEnum(PeriodicidadRefacturacion)
  @IsOptional()
  periodicidadRefacturacion?: PeriodicidadRefacturacion;

  @ApiProperty({ description: 'UUID del asegurado' })
  @IsUUID()
  aseguradoId: string;

  @ApiProperty({ description: 'UUID del bien asegurado' })
  @IsUUID()
  bienId: string;

  @ApiProperty({ description: 'UUID del productor' })
  @IsUUID()
  productorId: string;

  @ApiProperty({ description: 'UUID de la compañía aseguradora' })
  @IsUUID()
  companiaId: string;
}

export class UpdatePolizaDto {
  @ApiPropertyOptional({ enum: EstadoPoliza })
  @IsEnum(EstadoPoliza)
  @IsOptional()
  estado?: EstadoPoliza;

  @ApiPropertyOptional({ example: 14000.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  importeCuotaVigente?: number;

  @ApiPropertyOptional({ example: 'débito automático' })
  @IsString()
  @IsOptional()
  modalidadPago?: string;

  @ApiPropertyOptional({ enum: PeriodicidadRefacturacion })
  @IsEnum(PeriodicidadRefacturacion)
  @IsOptional()
  periodicidadRefacturacion?: PeriodicidadRefacturacion;
}

export class CreateEndosoDto {
  @ApiProperty({ example: 'END-2024-001' })
  @IsString()
  numeroEndoso: string;

  @ApiProperty({ example: 'Cambio de vehículo' })
  @IsString()
  tipoModificacion: string;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  fechaEmision: string;

  @ApiPropertyOptional({ example: 13500.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  importeActualizado?: number;

  @ApiPropertyOptional({ example: 500000.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sumaAseguradaActualizada?: number;
}
