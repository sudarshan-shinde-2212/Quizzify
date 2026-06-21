import { MigrationInterface, QueryRunner } from "typeorm";

export class RedesignNegativeMarking1781968058923 implements MigrationInterface {
    name = 'RedesignNegativeMarking1781968058923';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add negativeMarks column to quizzes table
        await queryRunner.query(`ALTER TABLE "quizzes" ADD COLUMN "negativeMarks" decimal(5,2) NOT NULL DEFAULT 0`);
        
        // 2. Migrate existing data from questions.negativeMarks to quizzes.negativeMarks using MAX
        await queryRunner.query(`
            UPDATE "quizzes" q
            SET "negativeMarks" = COALESCE(
                (SELECT MAX(qn."negativeMarks")
                 FROM "questions" qn
                 WHERE qn."quizId" = q.id),
                0
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the negativeMarks column from quizzes table
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "negativeMarks"`);
    }
}
