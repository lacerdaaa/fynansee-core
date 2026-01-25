import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthInvitesAndResets1768701300000 implements MigrationInterface {
    name = 'AuthInvitesAndResets1768701300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tenantId" uuid NOT NULL, "clientId" uuid, "email" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "userType" "public"."users_type_enum" NOT NULL, "role" character varying(50) NOT NULL, "tokenHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "acceptedAt" TIMESTAMP WITH TIME ZONE, "createdByUserId" uuid NOT NULL, CONSTRAINT "PK_49ff3ee8a0a9e0d74c7bfcdb6d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6c9a2706b6c2f2f8a5b0d71bd1" ON "auth_invitations" ("tokenHash") `);
        await queryRunner.query(`CREATE TABLE "password_resets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "tokenHash" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_2f0ef7db7b63f3d2e8f86954b01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_127e0f2a9e3a3233cc0c4b8d1d" ON "password_resets" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "auth_invitations" ADD CONSTRAINT "FK_auth_invites_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_invitations" ADD CONSTRAINT "FK_auth_invites_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_invitations" ADD CONSTRAINT "FK_auth_invites_creator" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_resets" ADD CONSTRAINT "FK_password_resets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_resets" DROP CONSTRAINT "FK_password_resets_user"`);
        await queryRunner.query(`ALTER TABLE "auth_invitations" DROP CONSTRAINT "FK_auth_invites_creator"`);
        await queryRunner.query(`ALTER TABLE "auth_invitations" DROP CONSTRAINT "FK_auth_invites_client"`);
        await queryRunner.query(`ALTER TABLE "auth_invitations" DROP CONSTRAINT "FK_auth_invites_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_127e0f2a9e3a3233cc0c4b8d1d"`);
        await queryRunner.query(`DROP TABLE "password_resets"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6c9a2706b6c2f2f8a5b0d71bd1"`);
        await queryRunner.query(`DROP TABLE "auth_invitations"`);
    }

}
