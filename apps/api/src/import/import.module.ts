import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Endoso } from '../database/entities/endoso.entity';
import { Organizador } from '../database/entities/organizador.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Productor } from '../database/entities/productor.entity';
import { Reclamo } from '../database/entities/reclamo.entity';
import { Siniestro } from '../database/entities/siniestro.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asegurado, BienAsegurado, CompaniaAseguradora,
      Cuota, Endoso, Organizador, Poliza,
      Productor, Reclamo, Siniestro,
    ]),
  ],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
