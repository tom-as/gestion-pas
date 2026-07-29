/**
 * Script de uso único: crea el usuario de acceso para el organizador ya existente en la DB.
 * Correr con: pnpm seed:admin
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Organizador } from '../entities/organizador.entity';
import { Usuario } from '../entities/usuario.entity';
import { UserRole, UserStatus } from '@gestion-pas/types';
import * as bcrypt from 'bcryptjs';

async function seedAdmin() {
  await AppDataSource.initialize();
  console.log('✓ Conectado a la base de datos');

  const orgRepo  = AppDataSource.getRepository(Organizador);
  const userRepo = AppDataSource.getRepository(Usuario);

  const org = await orgRepo.findOne({
    where: { dniCuil: '27242058203' },
  });
  if (!org) {
    console.error('❌ Organizador no encontrado. Corré el seed base primero.');
    process.exit(1);
  }

  const existing = await userRepo.findOne({
    where: { identificadorAcceso: 'florencia@gestionpas.com.ar' },
  });
  if (existing) {
    console.log('ℹ️  Usuario administrador ya existe, no se crea duplicado.');
    await AppDataSource.destroy();
    return;
  }

  const hashed = await bcrypt.hash('admin1234', 10);
  const user = userRepo.create({
    identificadorAcceso: 'florencia@gestionpas.com.ar',
    credencial: hashed,
    perfil: UserRole.ORGANIZADOR,
    estado: UserStatus.ACTIVO,
    organizador: org,
  });
  await userRepo.save(user);

  console.log('✅ Usuario organizador creado');
  console.log('   Email:    florencia@gestionpas.com.ar');
  console.log('   Password: admin1234');
  await AppDataSource.destroy();
}

seedAdmin().catch((e: unknown) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
