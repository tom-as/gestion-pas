import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoSiniestro, TipoSiniestro } from '@gestion-pas/types';

export class CreateSiniestroDto {
  @ApiProperty({ enum: TipoSiniestro })
  @IsEnum(TipoSiniestro)
  tipo: TipoSiniestro;

  @ApiProperty({ example: '2024-06-15' })
  @IsDateString()
  fechaOcurrencia: string;

  @ApiPropertyOptional({ example: '14:30' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'horaOcurrencia debe tener formato HH:MM' })
  @IsOptional()
  horaOcurrencia?: string;

  @ApiPropertyOptional({ example: 'Av. General Paz y Acceso Oeste' })
  @IsString()
  @IsOptional()
  lugarOcurrencia?: string;

  @ApiPropertyOptional({ example: 'El vehículo fue impactado por la derecha…' })
  @IsString()
  @IsOptional()
  relato?: string;

  @ApiPropertyOptional({ example: 'Nombre: Juan Pérez, patente: XY789ZZ, seguro: Galicia' })
  @IsString()
  @IsOptional()
  datosTerceros?: string;

  @ApiPropertyOptional({ example: 'DN-2024-456789' })
  @IsString()
  @IsOptional()
  numeroDenunciaCompania?: string;

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

export class UpdateSiniestroEstadoDto {
  @ApiProperty({ enum: EstadoSiniestro })
  @IsEnum(EstadoSiniestro)
  estado: EstadoSiniestro;

  @ApiPropertyOptional({ example: 'DN-2024-456789' })
  @IsString()
  @IsOptional()
  numeroDenunciaCompania?: string;
}
