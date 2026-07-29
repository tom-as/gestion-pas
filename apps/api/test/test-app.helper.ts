/**
 * Bootstrap helper for e2e tests.
 *
 * Creates a NestJS application connected to the REAL database (using the
 * same .env file that dev uses). Tests marked as e2e are expected to run
 * against a local PostgreSQL instance populated with the rich seed.
 *
 * Usage:
 *   const { app, token } = await createTestApp();
 *   await app.close();
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

/** Obtiene un JWT válido para el usuario organizador del seed. */
export async function getOrganizerToken(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ identificadorAcceso: 'florencia@gestionpas.com.ar', password: 'admin1234' });
  return res.body.accessToken as string;
}

/** Obtiene un JWT válido para el productor del seed. */
export async function getProductorToken(app: INestApplication): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ identificadorAcceso: 'leandro@gestionpas.com.ar', password: 'prod1234' });
  return res.body.accessToken as string;
}
