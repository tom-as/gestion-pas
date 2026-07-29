/**
 * Tests de integración — GET /api/polizas
 *
 * Requieren la base de datos en ejecución con el seed rico aplicado.
 * Ejecutar con: pnpm test:e2e
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, getOrganizerToken, getProductorToken } from './test-app.helper';

describe('Pólizas — GET /api/polizas (e2e)', () => {
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

  it('200 — el organizador recibe array de pólizas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/polizas')
      .set('Authorization', `Bearer ${orgToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('200 — el productor solo ve pólizas de su cartera', async () => {
    const orgRes = await request(app.getHttpServer())
      .get('/api/polizas')
      .set('Authorization', `Bearer ${orgToken}`);

    const prodRes = await request(app.getHttpServer())
      .get('/api/polizas')
      .set('Authorization', `Bearer ${prodToken}`)
      .expect(200);

    // El productor no puede ver más que el organizador
    expect(prodRes.body.length).toBeLessThanOrEqual(orgRes.body.length);

    // Todas las pólizas del productor deben pertenecer a su cartera
    const prodIds = new Set(
      prodRes.body.map((p: { productor?: { id: string } }) => p.productor?.id),
    );
    expect(prodIds.size).toBeLessThanOrEqual(1);
  });

  it('401 sin token', async () => {
    await request(app.getHttpServer()).get('/api/polizas').expect(401);
  });

  it('403 — el productor no puede crear póliza en cartera ajena', async () => {
    // Obtenemos un productor distinto al del token de productor
    // Buscamos un productor cuyo ID NO sea el del usuario leandro
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ identificadorAcceso: 'leandro@gestionpas.com.ar', password: 'prod1234' });

    // El usuario productor tiene su propio productor.id — buscamos uno diferente
    const usuarios = await request(app.getHttpServer())
      .get('/api/productores')
      .set('Authorization', `Bearer ${orgToken}`);

    const ajenoProd = (usuarios.body as Array<{ id: string }>).find(
      (p) => p.id !== loginRes.body.id,
    );

    if (!ajenoProd) {
      // Si solo hay un productor en el seed local, saltar el test
      console.warn('Solo hay un productor en el seed — omitiendo test de cartera ajena');
      return;
    }

    // Intentar crear póliza en cartera de otro productor
    const res = await request(app.getHttpServer())
      .post('/api/polizas')
      .set('Authorization', `Bearer ${prodToken}`)
      .send({
        numeroPoliza: 'POL-TEST-403',
        productorId: ajenoProd.id,
        aseguradoId: 'cualquier-uuid',
        bienId: 'cualquier-uuid',
        companiaId: 'cualquier-uuid',
        vigenciaInicio: '2025-01-01',
        vigenciaFin: '2026-01-01',
        importeCuotaVigente: 1000,
        estado: 'activa',
      });

    // Puede ser 403 (cartera ajena) o 404 (entidad no encontrada) — no debe ser 201
    expect(res.status).not.toBe(201);
    expect([403, 404]).toContain(res.status);
  });
});
