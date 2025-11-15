import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterFaqTitleLength1763300000000 implements MigrationInterface {
    name = 'AlterFaqTitleLength1763300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "faqs" ALTER COLUMN "title" TYPE character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "faqs" ALTER COLUMN "title" TYPE character varying(200)`);
    }

}


