import { MigrationInterface, QueryRunner } from "typeorm";

export class ImportSchema1768701000000 implements MigrationInterface {
    name = 'ImportSchema1768701000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."import_batch_status_enum" AS ENUM('uploaded', 'processed', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."import_row_status_enum" AS ENUM('pending', 'error', 'applied')`);
        await queryRunner.query(`CREATE TABLE "import_batches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "fileName" character varying(255) NOT NULL, "headers" jsonb NOT NULL DEFAULT '[]', "rowCount" integer NOT NULL DEFAULT 0, "errorCount" integer NOT NULL DEFAULT 0, "status" "public"."import_batch_status_enum" NOT NULL, "processedAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid, CONSTRAINT "PK_8f94a41a7bda9a13bdb1f99370c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5b73d11e32d30f5dd9c69d9b94" ON "import_batches" ("clientId", "status") `);
        await queryRunner.query(`CREATE TABLE "import_rows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "batchId" uuid NOT NULL, "rowIndex" integer NOT NULL, "data" jsonb NOT NULL, "errors" jsonb NOT NULL DEFAULT '[]', "status" "public"."import_row_status_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_568b8d1f3a8f25d6b5c6db75c8d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6f0f2ac1093b816d96d92a8504" ON "import_rows" ("batchId", "rowIndex") `);
        await queryRunner.query(`CREATE INDEX "IDX_1c0ea71fdc00f4a6f0938f7a42" ON "import_rows" ("batchId", "status") `);
        await queryRunner.query(`ALTER TABLE "import_batches" ADD CONSTRAINT "FK_import_batches_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "import_batches" ADD CONSTRAINT "FK_import_batches_created_by" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "import_rows" ADD CONSTRAINT "FK_import_rows_batch" FOREIGN KEY ("batchId") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "import_rows" DROP CONSTRAINT "FK_import_rows_batch"`);
        await queryRunner.query(`ALTER TABLE "import_batches" DROP CONSTRAINT "FK_import_batches_created_by"`);
        await queryRunner.query(`ALTER TABLE "import_batches" DROP CONSTRAINT "FK_import_batches_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c0ea71fdc00f4a6f0938f7a42"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6f0f2ac1093b816d96d92a8504"`);
        await queryRunner.query(`DROP TABLE "import_rows"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5b73d11e32d30f5dd9c69d9b94"`);
        await queryRunner.query(`DROP TABLE "import_batches"`);
        await queryRunner.query(`DROP TYPE "public"."import_row_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."import_batch_status_enum"`);
    }

}
