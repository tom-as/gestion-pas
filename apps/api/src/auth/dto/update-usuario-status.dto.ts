import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@gestion-pas/types';

export class UpdateUsuarioStatusDto {
  @ApiProperty({ enum: UserStatus })
  @IsEnum(UserStatus)
  estado: UserStatus;
}
