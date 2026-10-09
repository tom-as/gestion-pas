import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { SnakeCaseNamingStrategy } from './database/naming-strategy';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { AseguradosModule } from './asegurados/asegurados.module';
import { BienesModule } from './bienes/bienes.module';
import { ProductoresModule } from './productores/productores.module';
import { CompaniasModule } from './companias/companias.module';
import { PolizasModule } from './polizas/polizas.module';
import { CuotasModule } from './cuotas/cuotas.module';
import { SiniestrosModule } from './siniestros/siniestros.module';
import { ReclamosModule } from './reclamos/reclamos.module';
import { DocumentosModule } from './documentos/documentos.module';
import { ReportesModule } from './reportes/reportes.module';
import { ExportModule } from './export/export.module';
import { ImportModule } from './import/import.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import {
  Asegurado,
  BienAsegurado,
  ComentarioReclamo,
  ComentarioSiniestro,
  CompaniaAseguradora,
  Cuota,
  Documento,
  Endoso,
  Notificacion,
  Organizador,
  Poliza,
  Productor,
  Reclamo,
  Siniestro,
  Usuario,
} from './database/entities';

const ALL_ENTITIES = [
  Organizador,
  Productor,
  Asegurado,
  BienAsegurado,
  CompaniaAseguradora,
  Poliza,
  Endoso,
  Cuota,
  Siniestro,
  Reclamo,
  Documento,
  Usuario,
  ComentarioReclamo,
  ComentarioSiniestro,
  Notificacion,
];

@Module({
  imports: [
    // Variables de entorno disponibles en toda la app
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting: máximo 100 peticiones por minuto por IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Conexión a PostgreSQL vía TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'gestion_pas'),
        password: config.get<string>('DB_PASSWORD', 'gestion_pas_dev'),
        database: config.get<string>('DB_NAME', 'gestion_pas'),
        entities: ALL_ENTITIES,
        // synchronize: solo en development para crear schema automáticamente
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        migrationsRun: false,
        logging: config.get<string>('NODE_ENV') === 'development',
        namingStrategy: new SnakeCaseNamingStrategy(),
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    AseguradosModule,
    BienesModule,
    ProductoresModule,
    CompaniasModule,
    PolizasModule,
    CuotasModule,
    SiniestrosModule,
    ReclamosModule,
    DocumentosModule,
    ReportesModule,
    ExportModule,
    ImportModule,
    NotificacionesModule,
  ],
  providers: [
    // Guards globales: todo endpoint requiere JWT salvo los marcados @Public()
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
