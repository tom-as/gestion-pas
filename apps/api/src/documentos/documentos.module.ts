import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosService } from './documentos.service';
import { DocumentosController } from './documentos.controller';
import { Documento } from '../database/entities/documento.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Poliza } from '../database/entities/poliza.entity';
import { Cuota } from '../database/entities/cuota.entity';
import { Siniestro } from '../database/entities/siniestro.entity';
import { Reclamo } from '../database/entities/reclamo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Documento,
      Asegurado,
      BienAsegurado,
      Poliza,
      Cuota,
      Siniestro,
      Reclamo,
    ]),
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
