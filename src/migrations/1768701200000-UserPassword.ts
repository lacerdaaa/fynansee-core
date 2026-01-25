import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserPassword1768701200000 implements MigrationInterface {
  name = 'UserPassword1768701200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordHash" character varying(255)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordHash"`
    );
  }
}
