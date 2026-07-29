import { IsDateString, IsEmail, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAseguradoDto {
  @ApiProperty({ example: 'Carlos Martínez' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: '20123456789', description: 'DNI o CUIL — debe ser único en el sistema' })
  @IsString()
  @Length(7, 20)
  dniCuil: string;

  @ApiPropertyOptional({ example: '1985-04-12' })
  @IsDateString()
  @IsOptional()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ example: 'Av. Mitre 1234' })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({ example: '1650' })
  @IsString()
  @IsOptional()
  codigoPostal?: string;

  @ApiPropertyOptional({ example: '+5491166661111' })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({ example: 'carlos@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'UUID del productor asignado' })
  @IsUUID()
  productorId: string;
}
