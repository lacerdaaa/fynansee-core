import { MigrationInterface, QueryRunner } from "typeorm";

export class ImportStorageKey1768701100000 implements MigrationInterface {
    name = 'ImportStorageKey1768701100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "import_batches" ADD "storageKey" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "import_batches" DROP COLUMN "storageKey"`);
    }

}
