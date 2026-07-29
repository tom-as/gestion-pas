import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AseguradosService } from './asegurados.service';
import { AseguradosController } from './asegurados.controller';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asegurado, Productor])],
  controllers: [AseguradosController],
  providers: [AseguradosService],
  exports: [AseguradosService],
})
export class AseguradosModule {}
