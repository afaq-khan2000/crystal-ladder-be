import { MigrationInterface, QueryRunner } from "typeorm";

export class AllEntitites1762198967373 implements MigrationInterface {
    name = 'AllEntitites1762198967373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "services" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "name" character varying(200) NOT NULL, "description" text, "price" numeric(10,2), "duration" integer NOT NULL DEFAULT '60', "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id")); COMMENT ON COLUMN "services"."duration" IS 'Duration in minutes'`);
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "appointment_date" TIMESTAMP NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'pending', "notes" text, "cancellationReason" text, "parent_id" integer NOT NULL, "child_id" integer NOT NULL, "therapist_id" integer, "service_id" integer NOT NULL, CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reports_type_enum" AS ENUM('progress', 'session', 'assessment', 'general')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "title" character varying(200) NOT NULL, "content" text NOT NULL, "type" "public"."reports_type_enum" NOT NULL DEFAULT 'general', "metrics" json, "attachments" json, "child_id" integer NOT NULL, "therapist_id" integer NOT NULL, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id")); COMMENT ON COLUMN "reports"."metrics" IS 'Stores chart data or metrics'; COMMENT ON COLUMN "reports"."attachments" IS 'Attachment URLs array'`);
        await queryRunner.query(`CREATE TABLE "children" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "dateOfBirth" date, "gender" character varying(10), "diagnosis" text, "notes" text, "profile_image" character varying(500), "parent_id" integer NOT NULL, "therapist_id" integer, CONSTRAINT "PK_8c5a7cbebf2c702830ef38d22b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_type_enum" AS ENUM('direct', 'announcement', 'newsletter')`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "subject" character varying(200) NOT NULL, "content" text NOT NULL, "type" "public"."messages_type_enum" NOT NULL DEFAULT 'direct', "isRead" boolean NOT NULL DEFAULT false, "sender_id" integer NOT NULL, "receiver_id" integer, "attachments" json, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id")); COMMENT ON COLUMN "messages"."attachments" IS 'Attachment URLs array'`);
        await queryRunner.query(`CREATE TYPE "public"."audit_logs_action_enum" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'login', 'logout', 'view', 'export')`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "action" "public"."audit_logs_action_enum" NOT NULL, "entity" character varying(100) NOT NULL, "entity_id" integer, "description" text, "changes" json, "ip_address" character varying(50), "user_agent" text, "user_id" integer NOT NULL, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")); COMMENT ON COLUMN "audit_logs"."changes" IS 'Stores old and new values'`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('parent', 'admin', 'therapist', 'content-manager')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "email" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'parent', "phone" character varying(20), "address" text, "otp_code" character varying(6), "is_email_verified" boolean NOT NULL DEFAULT false, "is_password_forget" boolean NOT NULL DEFAULT false, "is_profile_complete" boolean NOT NULL DEFAULT false, "is_approved" boolean NOT NULL DEFAULT false, "profile_image" character varying(500), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."events_type_enum" AS ENUM('announcement', 'activity', 'workshop', 'meeting', 'other')`);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, "title" character varying(200) NOT NULL, "description" text NOT NULL, "type" "public"."events_type_enum" NOT NULL DEFAULT 'announcement', "event_date" TIMESTAMP NOT NULL, "event_end_date" TIMESTAMP, "location" character varying(200), "images" json, "isPublished" boolean NOT NULL DEFAULT true, "isFeatured" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id")); COMMENT ON COLUMN "events"."images" IS 'Image URLs array'`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_fc4911456d96e7698249c9118d0" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_21813b5b1e7553792e0d1662395" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_58735989ce83056369952f20b52" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_78dffc5e580e021dff88c42bcfe" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_1bc9f08d0ee60710011df9ac3ac" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "children" ADD CONSTRAINT "FK_e7f4185179e59c184d4ad363040" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "children" ADD CONSTRAINT "FK_6aea16831373c15dbc435b07802" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_b561864743d235f44e70addc1f5" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_b561864743d235f44e70addc1f5"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "children" DROP CONSTRAINT "FK_6aea16831373c15dbc435b07802"`);
        await queryRunner.query(`ALTER TABLE "children" DROP CONSTRAINT "FK_e7f4185179e59c184d4ad363040"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_1bc9f08d0ee60710011df9ac3ac"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_78dffc5e580e021dff88c42bcfe"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_2a2088e8eaa8f28d8de2bdbb857"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_58735989ce83056369952f20b52"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_21813b5b1e7553792e0d1662395"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_fc4911456d96e7698249c9118d0"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."audit_logs_action_enum"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
        await queryRunner.query(`DROP TABLE "children"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_type_enum"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
        await queryRunner.query(`DROP TABLE "services"`);
    }

}
