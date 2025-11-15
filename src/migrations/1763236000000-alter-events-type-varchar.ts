import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterEventsTypeVarchar1763236000000 implements MigrationInterface {
  name = 'AlterEventsTypeVarchar1763236000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "type" TYPE character varying(100) USING "type"::text`,
    );
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "type" SET DEFAULT 'announcement'`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."events_type_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."events_type_enum" AS ENUM('announcement', 'activity', 'workshop', 'meeting', 'other')`,
    );
    await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "type" TYPE "public"."events_type_enum" USING "type"::text::"public"."events_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "type" SET DEFAULT 'announcement'::"public"."events_type_enum"`,
    );
  }
}


