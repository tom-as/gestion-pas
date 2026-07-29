/**
 * Tests de integración — POST /api/auth/login
 *
 * Requieren la base de datos en ejecución con el seed rico aplicado.
 * Ejecutar con: pnpm test:e2e
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './test-app.helper';

describe('Auth — POST /api/auth/login (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('200 con accessToken y perfil cuando las credenciales son correctas', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identificadorAcceso: 'florencia@gestionpas.com.ar', password: 'admin1234' })
      .expect(200);

    expect(res.body).toMatchObject({
      accessToken: expect.any(String),
      perfil: 'organizador',
      id: expect.any(String),
    });
    // El accessToken debe ser un JWT de 3 partes separadas por puntos
    expect(res.body.accessToken.split('.').length).toBe(3);
  });

  it('401 cuando el email no existe en el sistema', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identificadorAcceso: 'noexiste@x.com', password: 'cualquiera' })
      .expect(401);
  });

  it('401 cuando la contraseña es incorrecta', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identificadorAcceso: 'florencia@gestionpas.com.ar', password: 'wrongpassword' })
      .expect(401);
  });

  it('400 cuando falta el campo password (validación DTO)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identificadorAcceso: 'florencia@gestionpas.com.ar' })
      .expect(400);
  });

  it('400 cuando el identificadorAcceso no es un email válido', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identificadorAcceso: 'no-es-un-email', password: 'admin1234' })
      .expect(400);
  });

  it('401 sin body no produce 500', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({});
    expect(res.status).not.toBe(500);
  });
});
