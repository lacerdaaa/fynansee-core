import { MigrationInterface, QueryRunner } from "typeorm";

export class ClosingsSchema1768700800000 implements MigrationInterface {
    name = 'ClosingsSchema1768700800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."closing_period_enum" AS ENUM('monthly', 'quarterly')`);
        await queryRunner.query(`CREATE TYPE "public"."closing_health_enum" AS ENUM('healthy', 'warning', 'critical')`);
        await queryRunner.query(`CREATE TABLE "closings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "periodType" "public"."closing_period_enum" NOT NULL, "periodStart" date NOT NULL, "periodEnd" date NOT NULL, "incomeTotal" numeric(14,2) NOT NULL, "expenseTotal" numeric(14,2) NOT NULL, "netTotal" numeric(14,2) NOT NULL, "startingBalance" numeric(14,2) NOT NULL, "endingBalance" numeric(14,2) NOT NULL, "dayOfCashShort" date, "lowIncomeDays" jsonb NOT NULL DEFAULT '[]', "lowIncomeDaysCount" integer NOT NULL DEFAULT 0, "healthStatus" "public"."closing_health_enum" NOT NULL, "generatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "createdByUserId" uuid, CONSTRAINT "PK_00f050f2ef259db6d68c3f5e5ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d9bd682f686e3d9d62f760a0f" ON "closings" ("clientId", "periodType", "periodStart", "periodEnd") `);
        await queryRunner.query(`ALTER TABLE "closings" ADD CONSTRAINT "FK_90f9d1b4f2b02b9a6c07060563c" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "closings" ADD CONSTRAINT "FK_closings_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "closings" DROP CONSTRAINT "FK_closings_created_by"`);
        await queryRunner.query(`ALTER TABLE "closings" DROP CONSTRAINT "FK_90f9d1b4f2b02b9a6c07060563c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d9bd682f686e3d9d62f760a0f"`);
        await queryRunner.query(`DROP TABLE "closings"`);
        await queryRunner.query(`DROP TYPE "public"."closing_health_enum"`);
        await queryRunner.query(`DROP TYPE "public"."closing_period_enum"`);
    }

}
