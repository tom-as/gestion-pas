import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCuota } from '@gestion-pas/types';

export class CreateCuotaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  numeroCuota: number;

  @ApiProperty({ example: 12500.5 })
  @IsNumber()
  @Min(0)
  importe: number;

  @ApiProperty({ example: '2024-02-01' })
  @IsDateString()
  fechaVencimiento: string;

  @ApiPropertyOptional({ enum: EstadoCuota, default: EstadoCuota.PENDIENTE })
  @IsEnum(EstadoCuota)
  @IsOptional()
  estado?: EstadoCuota;

  @ApiProperty({ description: 'UUID de la póliza' })
  @IsUUID()
  polizaId: string;
}

export class UpdateCuotaDto {
  @ApiPropertyOptional({ enum: EstadoCuota })
  @IsEnum(EstadoCuota)
  @IsOptional()
  estado?: EstadoCuota;

  @ApiPropertyOptional({ example: '2024-02-05' })
  @IsDateString()
  @IsOptional()
  fechaPagoEfectivo?: string;

  @ApiPropertyOptional({ example: 'transferencia bancaria' })
  @IsString()
  @IsOptional()
  medioPago?: string;
}
