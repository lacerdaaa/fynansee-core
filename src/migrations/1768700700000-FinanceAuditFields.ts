import { MigrationInterface, QueryRunner } from "typeorm";

export class FinanceAuditFields1768700700000 implements MigrationInterface {
    name = 'FinanceAuditFields1768700700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."record_source_enum" AS ENUM('manual', 'import')`);
        await queryRunner.query(`ALTER TABLE "entries" ADD "createdByUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "entries" ADD "source" "public"."record_source_enum" NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "provisions" ADD "createdByUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "provisions" ADD "source" "public"."record_source_enum" NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "balances" ADD "createdByUserId" uuid`);
        await queryRunner.query(`ALTER TABLE "balances" ADD "source" "public"."record_source_enum" NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_entries_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "provisions" ADD CONSTRAINT "FK_provisions_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_balances_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_balances_created_by"`);
        await queryRunner.query(`ALTER TABLE "provisions" DROP CONSTRAINT "FK_provisions_created_by"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_entries_created_by"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "balances" DROP COLUMN "createdByUserId"`);
        await queryRunner.query(`ALTER TABLE "provisions" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "provisions" DROP COLUMN "createdByUserId"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "source"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP COLUMN "createdByUserId"`);
        await queryRunner.query(`DROP TYPE "public"."record_source_enum"`);
    }

}
