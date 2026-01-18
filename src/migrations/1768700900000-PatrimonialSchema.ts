import { MigrationInterface, QueryRunner } from "typeorm";

export class PatrimonialSchema1768700900000 implements MigrationInterface {
    name = 'PatrimonialSchema1768700900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reserve_type_enum" AS ENUM('reserve', 'investment')`);
        await queryRunner.query(`CREATE TABLE "stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "value" numeric(14,2) NOT NULL, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "notes" character varying(500), "createdByUserId" uuid, "source" "public"."record_source_enum" NOT NULL DEFAULT 'manual', CONSTRAINT "PK_10be10e3fa50e0a7e5d06df0c3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reserves" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "type" "public"."reserve_type_enum" NOT NULL, "value" numeric(14,2) NOT NULL, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "label" character varying(255), "notes" character varying(500), "createdByUserId" uuid, "source" "public"."record_source_enum" NOT NULL DEFAULT 'manual', CONSTRAINT "PK_37b6e6a6b6e5852bf064b65c5f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_57bb7e2f0f0b6326a5c50c1c12" ON "stocks" ("clientId", "recordedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_606b8b6f7d7f5089a5c04a7e0f" ON "reserves" ("clientId", "type", "recordedAt") `);
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "FK_4bd2e4291932b5d3c48fe6e8c1e" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "FK_stocks_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reserves" ADD CONSTRAINT "FK_6e3a4c1e108e773a4f7bd79c400" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reserves" ADD CONSTRAINT "FK_reserves_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reserves" DROP CONSTRAINT "FK_reserves_created_by"`);
        await queryRunner.query(`ALTER TABLE "reserves" DROP CONSTRAINT "FK_6e3a4c1e108e773a4f7bd79c400"`);
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "FK_stocks_created_by"`);
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "FK_4bd2e4291932b5d3c48fe6e8c1e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_606b8b6f7d7f5089a5c04a7e0f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57bb7e2f0f0b6326a5c50c1c12"`);
        await queryRunner.query(`DROP TABLE "reserves"`);
        await queryRunner.query(`DROP TABLE "stocks"`);
        await queryRunner.query(`DROP TYPE "public"."reserve_type_enum"`);
    }

}
