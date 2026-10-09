/**
 * seed-productores.ts
 * Crea usuarios con perfil PRODUCTOR vinculados a los productores
 * que ya existen en el seed principal (seed.ts).
 *
 * Correr con:
 *   pnpm seed:productores
 *   (o: npx ts-node -r tsconfig-paths/register src/database/seeds/seed-productores.ts)
 *
 * Credenciales creadas:
 *   leandro@gestionpas.com.ar     / productor1234  → Leandro García
 *   sofia@gestionpas.com.ar       / productor1234  → Sofía Rodríguez
 *   marcelo.vazquez@gestionpas.com.ar / productor1234  → Marcelo Vázquez
 */
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Productor } from '../entities/productor.entity';
import { Usuario } from '../entities/usuario.entity';
import { UserRole, UserStatus } from '@gestion-pas/types';
import * as bcrypt from 'bcryptjs';

const PRODUCTORES_A_CREAR = [
  { dniCuil: '20345678901', email: 'leandro@gestionpas.com.ar' },
  { dniCuil: '27456789012', email: 'sofia@gestionpas.com.ar' },
  { dniCuil: '20567890123', email: 'marcelo.vazquez@gestionpas.com.ar' },
  // Patricia Moreno (INACTIVO) también recibe usuario; el estado de negocio
  // no bloquea el login — si se quiere desactivar, hacerlo desde auth/users/:id/status
  { dniCuil: '27678901234', email: 'patricia.moreno@gestionpas.com.ar' },
];

const PASSWORD = 'productor1234';

async function seed() {
  await AppDataSource.initialize();
  console.log('✓ Conectado a la base de datos');

  const productorRepo = AppDataSource.getRepository(Productor);
  const usuarioRepo   = AppDataSource.getRepository(Usuario);
  const hashed        = await bcrypt.hash(PASSWORD, 10);

  for (const { dniCuil, email } of PRODUCTORES_A_CREAR) {
    // Buscar la entidad Productor existente
    const productor = await productorRepo.findOne({ where: { dniCuil } });
    if (!productor) {
      console.warn(`⚠  Productor con CUIL ${dniCuil} no encontrado — corré seed.ts primero`);
      continue;
    }

    // Evitar duplicados
    const existe = await usuarioRepo.findOne({ where: { identificadorAcceso: email } });
    if (existe) {
      console.log(`ℹ  Usuario ${email} ya existe — saltando`);
      continue;
    }

    const usuario = usuarioRepo.create({
      identificadorAcceso: email,
      credencial: hashed,
      perfil: UserRole.PRODUCTOR,
      estado: UserStatus.ACTIVO,
      productor,
    });
    await usuarioRepo.save(usuario);
    console.log(`✅ Usuario productor creado: ${email}  →  ${productor.nombre}`);
  }

  console.log(`\nPassword para todos: ${PASSWORD}`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
