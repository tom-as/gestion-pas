import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // ── JWT_SECRET obligatorio en producción ────────────────────────────────
  if (isProduction && !process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET no está definido. El servidor no arrancará en producción sin él.');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // ── Seguridad HTTP ──────────────────────────────────────────────────────
  // Helmet añade cabeceras de seguridad estándar (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmet());

  // ── Prefijo global de la API ────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validación automática de DTOs con class-validator ──────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina propiedades no declaradas
      forbidNonWhitelisted: true,
      transform: true,           // transforma tipos automáticamente
    }),
  );

  // ── CORS ────────────────────────────────────────────────────────────────
  // En producción se restringe al dominio del frontend. En desarrollo se
  // acepta localhost:5173 como fallback.
  const frontendUrl = process.env.FRONTEND_URL;
  if (isProduction && !frontendUrl) {
    console.warn('ADVERTENCIA: FRONTEND_URL no definida en producción — CORS puede bloquear el frontend.');
  }
  app.enableCors({
    // En desarrollo se acepta cualquier origen (permite acceso desde la LAN).
    // En producción se restringe al FRONTEND_URL definido en el .env.
    origin: isProduction ? frontendUrl : true,
    credentials: true,
  });

  // ── Swagger — documentación automática de la API ────────────────────────
  // Solo disponible fuera de producción (evita exponer el contrato de la API)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Gestión PAS API')
      .setDescription('Sistema de gestión para Gestión PAS')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API corriendo en http://localhost:${port}/api`);
  if (!isProduction) {
    console.log(`Swagger en http://localhost:${port}/api/docs`);
  }
}

bootstrap();
