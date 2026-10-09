import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiniestrosService } from './siniestros.service';
import { SiniestrosController } from './siniestros.controller';
import { Siniestro } from '../database/entities/siniestro.entity';
import { ComentarioSiniestro } from '../database/entities/comentario-siniestro.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { BienAsegurado } from '../database/entities/bien-asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Siniestro,
      ComentarioSiniestro,
      Asegurado,
      BienAsegurado,
      Productor,
      CompaniaAseguradora,
      Usuario,
    ]),
    NotificacionesModule,
  ],
  controllers: [SiniestrosController],
  providers: [SiniestrosService],
  exports: [SiniestrosService],
})
export class SiniestrosModule {}
