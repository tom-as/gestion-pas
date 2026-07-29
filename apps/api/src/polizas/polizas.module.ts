import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolizasService } from './polizas.service';
import { PolizasController } from './polizas.controller';
import { Poliza } from '../database/entities/poliza.entity';
import { Endoso } from '../database/entities/endoso.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Poliza,
      Endoso,
      Asegurado,
      BienAsegurado,
      Productor,
      CompaniaAseguradora,
    ]),
  ],
  controllers: [PolizasController],
  providers: [PolizasService],
  exports: [PolizasService],
})
export class PolizasModule {}
