import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Siniestro } from '../database/entities/siniestro.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Productor } from '../database/entities/productor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asegurado,
      BienAsegurado,
      Poliza,
      Cuota,
      Siniestro,
      Reclamo,
      Productor,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
