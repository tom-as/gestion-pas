import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoresService } from './productores.service';
import { ProductoresController } from './productores.controller';
import { Productor } from '../database/entities/productor.entity';
import { Organizador } from '../database/entities/organizador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Productor, Organizador])],
  controllers: [ProductoresController],
  providers: [ProductoresService],
  exports: [ProductoresService],
})
export class ProductoresModule {}
