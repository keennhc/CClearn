import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { dataSourceOptions } from '../../database/data-source';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '@home-owners-hub/shared-types';

dotenv.config();

const ADMIN_EMAIL = 'admin@homeownershub.com';
const ADMIN_PASSWORD = 'Admin123!';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const existing = await userRepo.findOneBy({ email: ADMIN_EMAIL });

  if (existing) {
    console.log('Admin user already exists, skipping seed.');
    await dataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await userRepo.save(
    userRepo.create({
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.SUPER_ADMIN,
    }),
  );

  console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
