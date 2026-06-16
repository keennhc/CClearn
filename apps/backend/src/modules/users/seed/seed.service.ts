import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserRole } from '@home-owners-hub/shared-types';
import { UsersService } from '../users.service';

const ADMIN_EMAIL = 'admin@homeownershub.com';
const ADMIN_PASSWORD = 'Admin123!';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly usersService: UsersService) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.usersService.findByEmail(ADMIN_EMAIL);
    if (existing) {
      return;
    }

    await this.usersService.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });

    this.logger.log(`Seeded default admin user: ${ADMIN_EMAIL}`);
  }
}
