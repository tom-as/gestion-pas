import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { SnakeCaseNamingStrategy } from './naming-strategy';

dotenv.config({ path: join(__dirname, '../../.env') });

/**
 * DataSource usado exclusivamente por la CLI de TypeORM para generar y correr migraciones.
 * La app en runtime usa la configuración de AppModule (TypeOrmModule.forRootAsync).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'gestion_pas',
  password: process.env.DB_PASSWORD ?? 'gestion_pas_dev',
  database: process.env.DB_NAME ?? 'gestion_pas',
  entities: [join(__dirname, 'entities/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
  logging: true,
  namingStrategy: new SnakeCaseNamingStrategy(),
});
