import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniasService } from './companias.service';
import { CompaniasController } from './companias.controller';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompaniaAseguradora])],
  controllers: [CompaniasController],
  providers: [CompaniasService],
  exports: [CompaniasService],
})
export class CompaniasModule {}
