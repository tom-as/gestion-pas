import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UsoVehiculo } from '@gestion-pas/types';

export class UpdateBienAseguradoDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sumaAsegurada?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  anioFabricacion?: number;

  @ApiPropertyOptional({ enum: UsoVehiculo })
  @IsEnum(UsoVehiculo)
  @IsOptional()
  uso?: UsoVehiculo;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  tieneGnc?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accesoriosDeclarados?: string;

  // tipo y patente son inmutables — no se incluyen en update
}
