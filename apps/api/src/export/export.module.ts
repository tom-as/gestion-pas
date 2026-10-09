import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Endoso } from '../database/entities/endoso.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Productor } from '../database/entities/productor.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Siniestro } from '../database/entities/siniestro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asegurado, BienAsegurado, CompaniaAseguradora,
      Cuota, Endoso, Poliza, Productor, Reclamo, Siniestro,
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
