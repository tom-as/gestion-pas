import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1000000000000 implements MigrationInterface {
  name = 'InitialSchema1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum types ────────────────────────────────────────────────────
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('organizador', 'productor', 'asegurado')`);
    await queryRunner.query(`CREATE TYPE "user_status_enum" AS ENUM ('activo', 'inactivo')`);
    await queryRunner.query(`CREATE TYPE "tipo_bien_enum" AS ENUM ('automotor', 'hogar', 'vida', 'otro')`);
    await queryRunner.query(`CREATE TYPE "uso_vehiculo_enum" AS ENUM ('particular', 'comercial')`);
    await queryRunner.query(`CREATE TYPE "estado_poliza_enum" AS ENUM ('activa', 'suspendida', 'anulada')`);
    await queryRunner.query(`CREATE TYPE "periodicidad_refact_enum" AS ENUM ('mensual', 'trimestral', 'semestral', 'anual')`);
    await queryRunner.query(`CREATE TYPE "estado_cuota_enum" AS ENUM ('pendiente', 'pagada', 'rechazada', 'vencida')`);
    await queryRunner.query(`CREATE TYPE "tipo_siniestro_enum" AS ENUM ('colision', 'robo_total', 'robo_autopartes', 'hogar', 'vida', 'otro')`);
    await queryRunner.query(`CREATE TYPE "estado_siniestro_enum" AS ENUM ('abierto', 'en_gestion', 'resuelto', 'rechazado')`);
    await queryRunner.query(`CREATE TYPE "tipo_reclamo_enum" AS ENUM ('facturacion', 'cobertura', 'administrativo', 'otro')`);
    await queryRunner.query(`CREATE TYPE "estado_reclamo_enum" AS ENUM ('abierto', 'en_gestion', 'resuelto')`);
    await queryRunner.query(`CREATE TYPE "estado_productor_enum" AS ENUM ('activo', 'inactivo')`);
    await queryRunner.query(`CREATE TYPE "tipo_documento_enum" AS ENUM ('poliza', 'comprobante_pago', 'fotografia_danos', 'documentacion_personal', 'factura_accesorios')`);
    await queryRunner.query(`CREATE TYPE "entidad_documento_enum" AS ENUM ('asegurado', 'bien', 'poliza', 'cuota', 'siniestro', 'reclamo')`);

    // ── Tablas ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "organizadores" (
        "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"    VARCHAR(200) NOT NULL,
        "dni_cuil"  VARCHAR(20)  NOT NULL UNIQUE,
        "telefono"  VARCHAR(30),
        "email"     VARCHAR(200)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "productores" (
        "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"              VARCHAR(200) NOT NULL,
        "dni_cuil"            VARCHAR(20)  NOT NULL UNIQUE,
        "telefono"            VARCHAR(30),
        "email"               VARCHAR(200),
        "fecha_incorporacion" DATE,
        "companias_opera"     TEXT,
        "estado"              "estado_productor_enum" NOT NULL DEFAULT 'activo',
        "organizador_id"      UUID NOT NULL REFERENCES "organizadores"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "asegurados" (
        "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"           VARCHAR(200) NOT NULL,
        "dni_cuil"         VARCHAR(20)  NOT NULL UNIQUE,
        "fecha_nacimiento" DATE,
        "direccion"        VARCHAR(300),
        "codigo_postal"    VARCHAR(10),
        "telefono"         VARCHAR(30),
        "email"            VARCHAR(200),
        "productor_id"     UUID NOT NULL REFERENCES "productores"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "companias_aseguradoras" (
        "id"                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre"                     VARCHAR(200) NOT NULL UNIQUE,
        "periodo_d_gracia_dias"      INT,
        "periodicidad_refacturacion" "periodicidad_refact_enum",
        "mecanismo_notificacion"     VARCHAR(200)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bienes_asegurados" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tipo"                 "tipo_bien_enum" NOT NULL,
        "suma_asegurada"       NUMERIC(14,2),
        "patente"              VARCHAR(20),
        "marca"                VARCHAR(100),
        "modelo"               VARCHAR(100),
        "version"              VARCHAR(200),
        "anio_fabricacion"     INT,
        "uso"                  "uso_vehiculo_enum",
        "tiene_gnc"            BOOLEAN,
        "accesorios_declarados" TEXT,
        "asegurado_id"         UUID NOT NULL REFERENCES "asegurados"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "polizas" (
        "id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "numero_poliza"             VARCHAR(100) NOT NULL,
        "vigencia_inicio"           DATE         NOT NULL,
        "vigencia_fin"              DATE         NOT NULL,
        "importe_cuota_vigente"     NUMERIC(14,2) NOT NULL,
        "modalidad_pago"            VARCHAR(100),
        "estado"                    "estado_poliza_enum" NOT NULL DEFAULT 'activa',
        "periodicidad_refacturacion" "periodicidad_refact_enum",
        "asegurado_id"              UUID NOT NULL REFERENCES "asegurados"("id"),
        "bien_id"                   UUID NOT NULL REFERENCES "bienes_asegurados"("id"),
        "productor_id"              UUID NOT NULL REFERENCES "productores"("id"),
        "compania_id"               UUID NOT NULL REFERENCES "companias_aseguradoras"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "endosos" (
        "id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "numero_endoso"             VARCHAR(100) NOT NULL,
        "tipo_modificacion"         VARCHAR(200) NOT NULL,
        "importe_actualizado"       NUMERIC(14,2),
        "suma_asegurada_actualizada" NUMERIC(14,2),
        "fecha_emision"             DATE NOT NULL,
        "poliza_id"                 UUID NOT NULL REFERENCES "polizas"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cuotas" (
        "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "numero_cuota"        INT           NOT NULL,
        "importe"             NUMERIC(14,2) NOT NULL,
        "fecha_vencimiento"   DATE          NOT NULL,
        "estado"              "estado_cuota_enum" NOT NULL DEFAULT 'pendiente',
        "fecha_pago_efectivo" DATE,
        "medio_pago"          VARCHAR(100),
        "poliza_id"           UUID NOT NULL REFERENCES "polizas"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "siniestros" (
        "id"                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tipo"                    "tipo_siniestro_enum"  NOT NULL,
        "fecha_ocurrencia"        DATE NOT NULL,
        "hora_ocurrencia"         TIME,
        "lugar_ocurrencia"        VARCHAR(500),
        "relato"                  TEXT,
        "datos_terceros"          TEXT,
        "estado"                  "estado_siniestro_enum" NOT NULL DEFAULT 'abierto',
        "numero_denuncia_compania" VARCHAR(100),
        "asegurado_id"            UUID NOT NULL REFERENCES "asegurados"("id"),
        "bien_id"                 UUID NOT NULL REFERENCES "bienes_asegurados"("id"),
        "productor_id"            UUID NOT NULL REFERENCES "productores"("id"),
        "compania_id"             UUID NOT NULL REFERENCES "companias_aseguradoras"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reclamos" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tipo"          "tipo_reclamo_enum"   NOT NULL,
        "descripcion"   TEXT,
        "estado"        "estado_reclamo_enum" NOT NULL DEFAULT 'abierto',
        "fecha_apertura" DATE NOT NULL,
        "asegurado_id"  UUID NOT NULL REFERENCES "asegurados"("id"),
        "productor_id"  UUID NOT NULL REFERENCES "productores"("id"),
        "compania_id"   UUID REFERENCES "companias_aseguradoras"("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "documentos" (
        "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tipo"              "tipo_documento_enum"   NOT NULL,
        "entidad_vinculada" "entidad_documento_enum" NOT NULL,
        "tramite_contexto"  VARCHAR(300),
        "archivo_url"       VARCHAR(1000) NOT NULL,
        "fecha_incorporacion" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "asegurado_id"      UUID REFERENCES "asegurados"("id")         ON DELETE SET NULL,
        "bien_id"           UUID REFERENCES "bienes_asegurados"("id")  ON DELETE SET NULL,
        "poliza_id"         UUID REFERENCES "polizas"("id")            ON DELETE SET NULL,
        "cuota_id"          UUID REFERENCES "cuotas"("id")             ON DELETE SET NULL,
        "siniestro_id"      UUID REFERENCES "siniestros"("id")         ON DELETE SET NULL,
        "reclamo_id"        UUID REFERENCES "reclamos"("id")           ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "identificador_acceso" VARCHAR(200) NOT NULL UNIQUE,
        "credencial"           VARCHAR(200) NOT NULL,
        "perfil"               "user_role_enum"   NOT NULL,
        "estado"               "user_status_enum" NOT NULL DEFAULT 'activo',
        "ultima_sesion"        TIMESTAMPTZ,
        "organizador_id"       UUID REFERENCES "organizadores"("id") ON DELETE CASCADE,
        "productor_id"         UUID REFERENCES "productores"("id")   ON DELETE CASCADE,
        "asegurado_id"         UUID REFERENCES "asegurados"("id")    ON DELETE CASCADE
      )
    `);

    // ── Índices de búsqueda frecuente ─────────────────────────────────
    await queryRunner.query(`CREATE INDEX idx_asegurados_productor  ON asegurados(productor_id)`);
    await queryRunner.query(`CREATE INDEX idx_polizas_asegurado     ON polizas(asegurado_id)`);
    await queryRunner.query(`CREATE INDEX idx_polizas_productor     ON polizas(productor_id)`);
    await queryRunner.query(`CREATE INDEX idx_polizas_estado        ON polizas(estado)`);
    await queryRunner.query(`CREATE INDEX idx_cuotas_poliza         ON cuotas(poliza_id)`);
    await queryRunner.query(`CREATE INDEX idx_cuotas_estado         ON cuotas(estado)`);
    await queryRunner.query(`CREATE INDEX idx_cuotas_vencimiento    ON cuotas(fecha_vencimiento)`);
    await queryRunner.query(`CREATE INDEX idx_siniestros_estado     ON siniestros(estado)`);
    await queryRunner.query(`CREATE INDEX idx_reclamos_estado       ON reclamos(estado)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "usuarios"         CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documentos"       CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reclamos"         CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "siniestros"       CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cuotas"           CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "endosos"          CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "polizas"          CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bienes_asegurados" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companias_aseguradoras" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "asegurados"       CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "productores"      CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizadores"    CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "entidad_documento_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_documento_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_productor_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_reclamo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_reclamo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_siniestro_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_siniestro_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_cuota_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "periodicidad_refact_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_poliza_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "uso_vehiculo_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_bien_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
