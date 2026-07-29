import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoBien, UsoVehiculo } from '@gestion-pas/types';

export class CreateBienAseguradoDto {
  @ApiProperty({ enum: TipoBien })
  @IsEnum(TipoBien)
  tipo: TipoBien;

  @ApiPropertyOptional({ example: 8500000 })
  @IsNumber()
  @IsOptional()
  sumaAsegurada?: number;

  @ApiProperty({ description: 'UUID del asegurado titular' })
  @IsUUID()
  aseguradoId: string;

  // ── Atributos automotor (requeridos si tipo === automotor) ─────────

  @ApiPropertyOptional({ example: 'AB123CD', description: 'Patente — identificador primario del vehículo' })
  @ValidateIf((o: CreateBienAseguradoDto) => o.tipo === TipoBien.AUTOMOTOR)
  @IsString()
  @Length(6, 10)
  patente?: string;

  @ApiPropertyOptional({ example: 'Peugeot' })
  @IsString()
  @IsOptional()
  marca?: string;

  @ApiPropertyOptional({ example: '208' })
  @IsString()
  @IsOptional()
  modelo?: string;

  @ApiPropertyOptional({ example: 'Active 1.2 PureTech' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ example: 2021 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  anioFabricacion?: number;

  @ApiPropertyOptional({ enum: UsoVehiculo })
  @IsEnum(UsoVehiculo)
  @IsOptional()
  uso?: UsoVehiculo;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  tieneGnc?: boolean;

  @ApiPropertyOptional({ example: 'Llantas aleación 17"' })
  @IsString()
  @IsOptional()
  accesoriosDeclarados?: string;
}
