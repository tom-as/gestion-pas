import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReclamosService } from './reclamos.service';
import { ReclamosController } from './reclamos.controller';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reclamo,
      Asegurado,
      Productor,
      CompaniaAseguradora,
    ]),
  ],
  controllers: [ReclamosController],
  providers: [ReclamosService],
  exports: [ReclamosService],
})
export class ReclamosModule {}
