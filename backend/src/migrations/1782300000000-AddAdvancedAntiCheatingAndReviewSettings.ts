import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvancedAntiCheatingAndReviewSettings1782300000000 implements MigrationInterface {
    name = 'AddAdvancedAntiCheatingAndReviewSettings1782300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add review visibility setting to quizzes
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ADD COLUMN "allowReviewAfterSubmission" boolean NOT NULL DEFAULT false
        `);

        // Add advanced anti-cheating fields to quiz_attempts
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" 
            ADD COLUMN "warningCount" integer NOT NULL DEFAULT 0,
            ADD COLUMN "violationCount" integer NOT NULL DEFAULT 0,
            ADD COLUMN "violationTypes" text[],
            ADD COLUMN "violationTimestamps" text[],
            ADD COLUMN "disqualificationReason" text
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove review visibility setting from quizzes
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            DROP COLUMN "allowReviewAfterSubmission"
        `);

        // Remove advanced anti-cheating fields from quiz_attempts
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" 
            DROP COLUMN "warningCount",
            DROP COLUMN "violationCount",
            DROP COLUMN "violationTypes",
            DROP COLUMN "violationTimestamps",
            DROP COLUMN "disqualificationReason"
        `);
    }
}
