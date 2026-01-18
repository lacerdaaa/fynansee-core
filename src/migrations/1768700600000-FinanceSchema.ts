import { MigrationInterface, QueryRunner } from "typeorm";

export class FinanceSchema1768700600000 implements MigrationInterface {
    name = 'FinanceSchema1768700600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."entries_type_enum" AS ENUM('income', 'expense')`);
        await queryRunner.query(`CREATE TABLE "entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "type" "public"."entries_type_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "occurredOn" date NOT NULL, "description" character varying(255) NOT NULL, "notes" character varying(500), CONSTRAINT "PK_380ef04ca7e5c55f13c0a8f52f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."provisions_type_enum" AS ENUM('income', 'expense')`);
        await queryRunner.query(`CREATE TABLE "provisions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "type" "public"."provisions_type_enum" NOT NULL, "amount" numeric(14,2) NOT NULL, "dueOn" date NOT NULL, "description" character varying(255) NOT NULL, "notes" character varying(500), CONSTRAINT "PK_3f4505f1c3f6a7f1aa205b9bdc7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "amount" numeric(14,2) NOT NULL, "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_89c08b2b4d78a9e1f0c50d6f5a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4f844ff050ea7a6ac0c808d0e0" ON "entries" ("clientId", "occurredOn") `);
        await queryRunner.query(`CREATE INDEX "IDX_d7d3ef6f1b809c109f92266b18" ON "provisions" ("clientId", "dueOn") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e815b875c478c962d7a7d70da" ON "balances" ("clientId", "recordedAt") `);
        await queryRunner.query(`ALTER TABLE "entries" ADD CONSTRAINT "FK_2b616d1b5e39d19fe247c2c9b6e" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "provisions" ADD CONSTRAINT "FK_a479d7bf4e07de8420d60c1a54c" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "balances" ADD CONSTRAINT "FK_8ccf5a93a0fa22a333e26b2cc5d" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "balances" DROP CONSTRAINT "FK_8ccf5a93a0fa22a333e26b2cc5d"`);
        await queryRunner.query(`ALTER TABLE "provisions" DROP CONSTRAINT "FK_a479d7bf4e07de8420d60c1a54c"`);
        await queryRunner.query(`ALTER TABLE "entries" DROP CONSTRAINT "FK_2b616d1b5e39d19fe247c2c9b6e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e815b875c478c962d7a7d70da"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7d3ef6f1b809c109f92266b18"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f844ff050ea7a6ac0c808d0e0"`);
        await queryRunner.query(`DROP TABLE "balances"`);
        await queryRunner.query(`DROP TABLE "provisions"`);
        await queryRunner.query(`DROP TYPE "public"."provisions_type_enum"`);
        await queryRunner.query(`DROP TABLE "entries"`);
        await queryRunner.query(`DROP TYPE "public"."entries_type_enum"`);
    }

}
