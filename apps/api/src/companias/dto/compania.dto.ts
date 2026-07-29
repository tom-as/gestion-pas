import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PeriodicidadRefacturacion } from '@gestion-pas/types';

export class CreateCompaniaDto {
  @ApiProperty({ example: 'La Equitativa' })
  @IsString()
  nombre: string;

  @ApiPropertyOptional({ example: 5, description: 'Días de gracia ante rechazo de pago' })
  @IsInt()
  @Min(0)
  @IsOptional()
  periodoDGraciaDias?: number;

  @ApiPropertyOptional({ enum: PeriodicidadRefacturacion })
  @IsEnum(PeriodicidadRefacturacion)
  @IsOptional()
  periodicidadRefacturacion?: PeriodicidadRefacturacion;

  @ApiPropertyOptional({ example: 'portal', description: 'portal | email | ninguno' })
  @IsString()
  @IsOptional()
  mecanismoNotificacion?: string;
}

export class UpdateCompaniaDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  periodoDGraciaDias?: number;

  @ApiPropertyOptional({ enum: PeriodicidadRefacturacion })
  @IsEnum(PeriodicidadRefacturacion)
  @IsOptional()
  periodicidadRefacturacion?: PeriodicidadRefacturacion;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mecanismoNotificacion?: string;

  // nombre es inmutable una vez creada la compañía
}
