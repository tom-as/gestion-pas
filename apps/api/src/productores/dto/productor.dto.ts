import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoProductor } from '@gestion-pas/types';

export class CreateProductorDto {
  @ApiProperty({ example: 'Sofía Rodríguez' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: '27456789012' })
  @IsString()
  @Length(7, 20)
  dniCuil: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '2021-06-15' })
  @IsDateString()
  @IsOptional()
  fechaIncorporacion?: string;

  @ApiPropertyOptional({ example: 'Federación Patronal, Galicia' })
  @IsString()
  @IsOptional()
  companiasOpera?: string;

  @ApiProperty({ description: 'UUID del organizador de referencia' })
  @IsUUID()
  organizadorId: string;
}

export class UpdateProductorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  fechaIncorporacion?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  companiasOpera?: string;

  @ApiPropertyOptional({ enum: EstadoProductor })
  @IsEnum(EstadoProductor)
  @IsOptional()
  estado?: EstadoProductor;
}
