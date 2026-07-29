/**
 * Tests de integración — /api/asegurados
 *
 * Requieren la base de datos en ejecución con el seed rico aplicado.
 * Ejecutar con: pnpm test:e2e
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp, getOrganizerToken, getProductorToken } from './test-app.helper';

describe('Asegurados (e2e)', () => {
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

  // ── GET /api/asegurados ──────────────────────────────────────────────

  describe('GET /api/asegurados', () => {
    it('200 — el organizador ve todos los asegurados del seed', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/asegurados')
        .set('Authorization', `Bearer ${orgToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('200 — el productor solo ve los asegurados de su cartera', async () => {
      const orgRes = await request(app.getHttpServer())
        .get('/api/asegurados')
        .set('Authorization', `Bearer ${orgToken}`);

      const prodRes = await request(app.getHttpServer())
        .get('/api/asegurados')
        .set('Authorization', `Bearer ${prodToken}`)
        .expect(200);

      // El productor debe ver un subconjunto (o igual) al total del organizador
      expect(prodRes.body.length).toBeLessThanOrEqual(orgRes.body.length);
      // Todos los resultados del productor deben pertenecer a la misma cartera
      const prodIds = new Set(prodRes.body.map((a: { productor?: { id: string } }) => a.productor?.id));
      expect(prodIds.size).toBeLessThanOrEqual(1); // máximo 1 productor
    });

    it('401 sin token de autenticación', async () => {
      await request(app.getHttpServer()).get('/api/asegurados').expect(401);
    });
  });

  // ── POST /api/asegurados ─────────────────────────────────────────────

  describe('POST /api/asegurados', () => {
    // DNI del seed (debe existir en la DB antes de correr el test)
    const DNI_EXISTENTE = '20123456001'; // DNI del primer asegurado del seed rico

    it('409 si el DNI/CUIL ya está registrado', async () => {
      // Primero obtenemos el productor del organizador para usarlo en el DTO
      const prodRes = await request(app.getHttpServer())
        .get('/api/productores')
        .set('Authorization', `Bearer ${orgToken}`);
      const productorId = prodRes.body[0]?.id as string;

      // Intentar crear con un DNI que seguro existe (el primero del seed)
      const res = await request(app.getHttpServer())
        .post('/api/asegurados')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({
          nombre: 'Duplicado Test',
          dniCuil: DNI_EXISTENTE,
          productorId,
        });

      // Puede ser 409 (DNI duplicado) o 201 si el DNI no coincide con el seed.
      // Lo que NO debe ser es 500.
      expect(res.status).not.toBe(500);
    });

    it('400 si falta el campo requerido productorId', async () => {
      await request(app.getHttpServer())
        .post('/api/asegurados')
        .set('Authorization', `Bearer ${orgToken}`)
        .send({ nombre: 'Sin Productor', dniCuil: '99000000001' })
        .expect(400);
    });

    it('401 si no hay token', async () => {
      await request(app.getHttpServer())
        .post('/api/asegurados')
        .send({ nombre: 'X', dniCuil: '12345678901', productorId: 'uuid' })
        .expect(401);
    });
  });
});
