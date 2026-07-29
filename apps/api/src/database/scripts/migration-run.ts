import 'reflect-metadata';
import { AppDataSource } from '../data-source';

AppDataSource.initialize()
  .then((ds) => ds.runMigrations())
  .then(() => { console.log('✅ Migrations done'); process.exit(0); })
  .catch((e: unknown) => { console.error('❌ Migration error:', e); process.exit(1); });
