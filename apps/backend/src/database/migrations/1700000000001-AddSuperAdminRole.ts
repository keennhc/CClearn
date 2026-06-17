import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperAdminRole1700000000001 implements MigrationInterface {
  name = 'AddSuperAdminRole1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN' BEFORE 'ADMIN'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN'`,
    );
    await queryRunner.query(
      `ALTER TYPE "users_role_enum" RENAME TO "users_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'USER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "users_role_enum" USING "role"::text::"users_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "users_role_enum_old"`);
  }
}
