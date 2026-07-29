import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@gestion-pas/types';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'sofia@gestionpas.com.ar' })
  @IsEmail()
  identificadorAcceso: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.PRODUCTOR })
  @IsEnum(UserRole)
  perfil: UserRole;

  /**
   * ID de la entidad de negocio ya existente (Organizador, Productor o Asegurado)
   * a la que se asocia este usuario.
   */
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  entidadId?: string;
}
