import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AseguradosService } from './asegurados.service';
import { AseguradosController } from './asegurados.controller';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Poliza } from '../database/entities/poliza.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asegurado, Productor, Cuota, Poliza])],
  controllers: [AseguradosController],
  providers: [AseguradosService],
  exports: [AseguradosService],
})
export class AseguradosModule {}
