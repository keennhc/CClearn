import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageAttachments1700000000003 implements MigrationInterface {
  name = 'AddMessageAttachments1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "community_messages" ADD "attachmentUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" ADD "attachmentType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" ADD "attachmentName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" ALTER COLUMN "message" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "community_messages" SET "message" = '' WHERE "message" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" ALTER COLUMN "message" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" DROP COLUMN "attachmentName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" DROP COLUMN "attachmentType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "community_messages" DROP COLUMN "attachmentUrl"`,
    );
  }
}
