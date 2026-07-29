import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntidadDocumento, TipoDocumento } from '@gestion-pas/types';

export class CreateDocumentoDto {
  @ApiProperty({ enum: TipoDocumento })
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;

  @ApiProperty({ enum: EntidadDocumento, description: 'Tipo de entidad a la que pertenece' })
  @IsEnum(EntidadDocumento)
  entidadVinculada: EntidadDocumento;

  @ApiProperty({ description: 'UUID de la entidad vinculada' })
  @IsUUID()
  entidadId: string;

  @ApiProperty({ example: 'https://storage.example.com/docs/poliza-001.pdf' })
  @IsUrl()
  archivoUrl: string;

  @ApiPropertyOptional({ example: 'Póliza emitida en renovación anual 2024' })
  @IsString()
  @IsOptional()
  tramiteContexto?: string;
}
