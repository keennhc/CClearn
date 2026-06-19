import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeDataToCommunities1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "community_messages" ADD "communityId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD "communityId" uuid`,
    );

    const defaultCommunity = await queryRunner.query(
      `SELECT "id" FROM "communities" WHERE "code" = 'DEFAULT1' LIMIT 1`,
    );

    if (defaultCommunity.length > 0) {
      const communityId = defaultCommunity[0].id;
      await queryRunner.query(
        `UPDATE "community_messages" SET "communityId" = $1 WHERE "communityId" IS NULL`,
        [communityId],
      );
      await queryRunner.query(
        `UPDATE "announcements" SET "communityId" = $1 WHERE "communityId" IS NULL`,
        [communityId],
      );
    }

    await queryRunner.query(
      `ALTER TABLE "community_messages" ALTER COLUMN "communityId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ALTER COLUMN "communityId" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "community_messages" ADD CONSTRAINT "FK_community_messages_communityId"
       FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_communityId"
       FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "announcements" DROP CONSTRAINT "FK_announcements_communityId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" DROP CONSTRAINT "FK_community_messages_communityId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "announcements" DROP COLUMN "communityId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" DROP COLUMN "communityId"`,
    );
  }
}
