import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommunities1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "community_member_role_enum" AS ENUM('COMMUNITY_ADMIN', 'COMMUNITY_MEMBER')
    `);

    await queryRunner.query(`
      CREATE TABLE "communities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "code" character varying NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdBy" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_communities" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_communities_code" UNIQUE ("code"),
        CONSTRAINT "FK_communities_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "community_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "communityId" uuid NOT NULL,
        "role" "community_member_role_enum" NOT NULL DEFAULT 'COMMUNITY_MEMBER',
        "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_community_members_user_community" UNIQUE ("userId", "communityId"),
        CONSTRAINT "FK_community_members_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_members_communityId" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE
      )
    `);

    const superAdmin = await queryRunner.query(
      `SELECT "id" FROM "users" WHERE "email" = $1 LIMIT 1`,
      ['admin@homeownershub.com'],
    );

    if (superAdmin.length > 0) {
      const adminId = superAdmin[0].id;

      const [community] = await queryRunner.query(
        `INSERT INTO "communities" ("name", "code", "createdBy")
         VALUES ('Default Community', 'DEFAULT1', $1)
         RETURNING "id"`,
        [adminId],
      );
      const communityId = community.id;

      await queryRunner.query(
        `INSERT INTO "community_members" ("userId", "communityId", "role")
         SELECT "id", $1, 'COMMUNITY_ADMIN'
         FROM "users"
         WHERE "role" = 'ADMIN'`,
        [communityId],
      );

      await queryRunner.query(
        `INSERT INTO "community_members" ("userId", "communityId", "role")
         SELECT "id", $1, 'COMMUNITY_ADMIN'
         FROM "users"
         WHERE "role" = 'SUPER_ADMIN'`,
        [communityId],
      );

      await queryRunner.query(
        `INSERT INTO "community_members" ("userId", "communityId", "role")
         SELECT "id", $1, 'COMMUNITY_MEMBER'
         FROM "users"
         WHERE "role" = 'USER'`,
        [communityId],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "community_members"`);
    await queryRunner.query(`DROP TABLE "communities"`);
    await queryRunner.query(`DROP TYPE "community_member_role_enum"`);
  }
}
