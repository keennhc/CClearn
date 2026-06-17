import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileImageUrl1700000000002 implements MigrationInterface {
  name = 'AddProfileImageUrl1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profileImageUrl" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profileImageUrl"`,
    );
  }
}
