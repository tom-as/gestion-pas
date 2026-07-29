import 'reflect-metadata';
import { AppDataSource } from '../data-source';

AppDataSource.initialize()
  .then((ds) => ds.undoLastMigration())
  .then(() => { console.log('✅ Migration reverted'); process.exit(0); })
  .catch((e: unknown) => { console.error('❌ Revert error:', e); process.exit(1); });
