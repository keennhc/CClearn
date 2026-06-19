import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { dataSourceOptions } from '../../database/data-source';
import { User } from '../../modules/users/entities/user.entity';
import { Community } from '../../modules/communities/entities/community.entity';
import { CommunityMember } from '../../modules/communities/entities/community-member.entity';
import { UserRole, CommunityMemberRole } from '@home-owners-hub/shared-types';

dotenv.config();

const ADMIN_EMAIL = 'admin@homeownershub.com';
const ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_COMMUNITY_CODE = 'DEFAULT1';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const communityRepo = dataSource.getRepository(Community);
  const memberRepo = dataSource.getRepository(CommunityMember);

  let admin = await userRepo.findOneBy({ email: ADMIN_EMAIL });

  if (!admin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin = await userRepo.save(
      userRepo.create({
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.SUPER_ADMIN,
      }),
    );
    console.log(`Seeded admin user: ${ADMIN_EMAIL}`);
  } else {
    console.log('Admin user already exists, skipping user seed.');
  }

  let community = await communityRepo.findOneBy({ code: DEFAULT_COMMUNITY_CODE });

  if (!community) {
    community = await communityRepo.save(
      communityRepo.create({
        name: 'Default Community',
        code: DEFAULT_COMMUNITY_CODE,
        createdBy: admin.id,
      }),
    );
    console.log('Seeded default community.');
  } else {
    console.log('Default community already exists, skipping community seed.');
  }

  const membership = await memberRepo.findOneBy({
    userId: admin.id,
    communityId: community.id,
  });

  if (!membership) {
    await memberRepo.save(
      memberRepo.create({
        userId: admin.id,
        communityId: community.id,
        role: CommunityMemberRole.COMMUNITY_ADMIN,
      }),
    );
    console.log('Seeded admin community membership.');
  } else {
    console.log('Admin community membership already exists, skipping.');
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
