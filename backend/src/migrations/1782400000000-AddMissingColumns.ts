import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumns1782400000000 implements MigrationInterface {
    name = 'AddMissingColumns1782400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add maxRetakes to quizzes
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ADD COLUMN "maxRetakes" integer NOT NULL DEFAULT 0
        `);
        // Add passingScore to quizzes
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ADD COLUMN "passingScore" numeric(5,2) NOT NULL DEFAULT 60
        `);
        // Add isCheating to quiz_attempts
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" 
            ADD COLUMN "isCheating" boolean NOT NULL DEFAULT false
        `);
        // Remove unique constraint on (studentId, quizId) from quiz_attempts
        // First we need to find the name of the constraint
        const constraints = await queryRunner.query(`
            SELECT conname FROM pg_constraint 
            WHERE conrelid = 'quiz_attempts'::regclass 
            AND contype = 'u'
        `);
        // Drop each unique constraint
        for (const constraint of constraints) {
            await queryRunner.query(`
                ALTER TABLE "quiz_attempts" 
                DROP CONSTRAINT "${constraint.conname}"
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            DROP COLUMN "maxRetakes",
            DROP COLUMN "passingScore"
        `);
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" 
            DROP COLUMN "isCheating"
        `);
        // Re-add unique constraint (we'll use the same logic as original)
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" 
            ADD CONSTRAINT "UQ_quiz_attempts_studentId_quizId" UNIQUE ("studentId", "quizId")
        `);
    }
}
