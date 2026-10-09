import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComentarioDto {
  @ApiProperty({ example: 'Necesito más información sobre el incidente.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  texto: string;
}
