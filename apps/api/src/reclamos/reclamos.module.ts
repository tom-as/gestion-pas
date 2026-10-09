import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReclamosService } from './reclamos.service';
import { ReclamosController } from './reclamos.controller';
import { Reclamo } from '../database/entities/reclamo.entity';
import { ComentarioReclamo } from '../database/entities/comentario-reclamo.entity';
import { Asegurado } from '../database/entities/asegurado.entity';
import { Productor } from '../database/entities/productor.entity';
import { CompaniaAseguradora } from '../database/entities/compania-aseguradora.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reclamo,
      ComentarioReclamo,
      Asegurado,
      Productor,
      CompaniaAseguradora,
      Usuario,
    ]),
    NotificacionesModule,
  ],
  controllers: [ReclamosController],
  providers: [ReclamosService],
  exports: [ReclamosService],
})
export class ReclamosModule {}
