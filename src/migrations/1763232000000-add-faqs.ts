import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFaqs1763232000000 implements MigrationInterface {
    name = 'AddFaqs1763232000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "faqs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "title" character varying(200) NOT NULL, "description" text NOT NULL, "isPublished" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_faqs_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "faqs"`);
    }

}


