import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BienesService } from './bienes.service';
import { BienesController } from './bienes.controller';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Asegurado } from '../database/entities/asegurado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BienAsegurado, Asegurado])],
  controllers: [BienesController],
  providers: [BienesService],
  exports: [BienesService],
})
export class BienesModule {}
