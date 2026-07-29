import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuotasService } from './cuotas.service';
import { CuotasController } from './cuotas.controller';
import { Cuota } from '../database/entities/cuota.entity';
import { Poliza } from '../database/entities/poliza.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota, Poliza])],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
