import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1768700400045 implements MigrationInterface {
    name = 'InitialSchema1768700400045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tenant_users_role_enum" AS ENUM('owner', 'admin', 'analyst')`);
        await queryRunner.query(`CREATE TABLE "tenant_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."tenant_users_role_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_8ce1bc9e3a5887c234900365447" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8fa3e63dcfe2fe25531f8849e4" ON "tenant_users" ("tenantId", "userId") `);
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "document" character varying(50), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."client_users_role_enum" AS ENUM('client_admin', 'client_viewer')`);
        await queryRunner.query(`CREATE TABLE "client_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "clientId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."client_users_role_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_fe74bfd4d01077395ee4204b553" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cbb0ef7805f14d44e10573df13" ON "client_users" ("clientId", "userId") `);
        await queryRunner.query(`CREATE TYPE "public"."users_type_enum" AS ENUM('controller', 'client')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "oauthProvider" character varying(50) NOT NULL DEFAULT 'google', "oauthSubject" character varying(255), "type" "public"."users_type_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4f21788785d810f9365a845284" ON "users" ("oauthProvider", "oauthSubject") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "tenant_users" ADD CONSTRAINT "FK_b60b5094f416190c9b3103cba2a" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tenant_users" ADD CONSTRAINT "FK_5c0a747551be06a29ac8196037e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_78708145905b919ba16977437b4" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_users" ADD CONSTRAINT "FK_3cd05fd13c044ffd22f5bf2ec1a" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_users" ADD CONSTRAINT "FK_d51f0c13ed457cabc2075a9bd7d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_users" DROP CONSTRAINT "FK_d51f0c13ed457cabc2075a9bd7d"`);
        await queryRunner.query(`ALTER TABLE "client_users" DROP CONSTRAINT "FK_3cd05fd13c044ffd22f5bf2ec1a"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_78708145905b919ba16977437b4"`);
        await queryRunner.query(`ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_5c0a747551be06a29ac8196037e"`);
        await queryRunner.query(`ALTER TABLE "tenant_users" DROP CONSTRAINT "FK_b60b5094f416190c9b3103cba2a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f21788785d810f9365a845284"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cbb0ef7805f14d44e10573df13"`);
        await queryRunner.query(`DROP TABLE "client_users"`);
        await queryRunner.query(`DROP TYPE "public"."client_users_role_enum"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fa3e63dcfe2fe25531f8849e4"`);
        await queryRunner.query(`DROP TABLE "tenant_users"`);
        await queryRunner.query(`DROP TYPE "public"."tenant_users_role_enum"`);
    }

}
