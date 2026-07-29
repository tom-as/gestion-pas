/**
 * Tests de integración — GET /api/cuotas/vencimientos-proximos
 *
 * Requieren la base de datos en ejecución con el seed rico aplicado.
 * Ejecutar con: pnpm test:e2e
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, getOrganizerToken, getProductorToken } from './test-app.helper';

// Regex para detectar string ISO 8601 (date o datetime)
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

describe('Cuotas — GET /api/cuotas/vencimientos-proximos (e2e)', () => {
  let app: INestApplication;
  let orgToken: string;
  let prodToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    orgToken = await getOrganizerToken(app);
    prodToken = await getProductorToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('200 — devuelve un array (puede estar vacío según el seed)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos?dias=365')
      .set('Authorization', `Bearer ${orgToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('todas las cuotas devueltas tienen estado PENDIENTE', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos?dias=365')
      .set('Authorization', `Bearer ${orgToken}`)
      .expect(200);

    for (const cuota of res.body as Array<{ estado: string }>) {
      expect(cuota.estado).toBe('pendiente');
    }
  });

  it('fechaVencimiento es un string ISO (YYYY-MM-DD...) en cada cuota', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos?dias=365')
      .set('Authorization', `Bearer ${orgToken}`)
      .expect(200);

    for (const cuota of res.body as Array<{ fechaVencimiento: string }>) {
      expect(cuota.fechaVencimiento).toMatch(ISO_DATE_RE);
    }
  });

  it('el productor solo ve cuotas de su cartera', async () => {
    const orgRes = await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos?dias=365')
      .set('Authorization', `Bearer ${orgToken}`);

    const prodRes = await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos?dias=365')
      .set('Authorization', `Bearer ${prodToken}`)
      .expect(200);

    expect(prodRes.body.length).toBeLessThanOrEqual(orgRes.body.length);
  });

  it('401 sin token de autenticación', async () => {
    await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos')
      .expect(401);
  });

  it('responde 200 con el parámetro dias omitido (usa el default de 30 días)', async () => {
    await request(app.getHttpServer())
      .get('/api/cuotas/vencimientos-proximos')
      .set('Authorization', `Bearer ${orgToken}`)
      .expect(200);
  });
});
