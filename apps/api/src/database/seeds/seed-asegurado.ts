/**
 * seed-asegurado.ts
 * Crea un usuario con perfil ASEGURADO vinculado a Carlos Martinez
 * que ya existe en el seed principal.
 *
 * Correr con:
 *   npx ts-node -r tsconfig-paths/register src/database/seeds/seed-asegurado.ts
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Usuario } from '../entities/usuario.entity';
import { Asegurado } from '../entities/asegurado.entity';
import { UserRole, UserStatus } from '@gestion-pas/types';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Conectado a la base de datos');

  const usuarioRepo  = AppDataSource.getRepository(Usuario);
  const aseguradoRepo = AppDataSource.getRepository(Asegurado);

  const email = 'carlos@gestionpas.com.ar';

  const existe = await usuarioRepo.findOne({ where: { identificadorAcceso: email } });
  if (existe) {
    console.log(`ℹ Usuario ${email} ya existe — saltando`);
    await AppDataSource.destroy();
    return;
  }

  // Buscar el asegurado de prueba por DNI
  const asegurado = await aseguradoRepo.findOne({ where: { dniCuil: '20123456789' } });
  if (!asegurado) {
    console.error('❌ Asegurado Carlos Martinez no encontrado — corre el seed principal primero');
    await AppDataSource.destroy();
    process.exit(1);
  }

  const hashed = await bcrypt.hash('cliente1234', 10);
  const usuario = usuarioRepo.create({
    identificadorAcceso: email,
    credencial: hashed,
    perfil: UserRole.ASEGURADO,
    estado: UserStatus.ACTIVO,
    asegurado,
  });
  await usuarioRepo.save(usuario);

  console.log('✅ Usuario asegurado creado:');
  console.log(`   Email:     ${email}`);
  console.log('   Password:  cliente1234');
  console.log(`   Asegurado: ${asegurado.nombre} (${asegurado.dniCuil})`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
