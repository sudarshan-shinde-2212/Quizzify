import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureMarksDecimal1750000000002 implements MigrationInterface {
  name = 'EnsureMarksDecimal1750000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure marks column on questions is DECIMAL(5,2) with default 1
    // (already correct via entity, but we enforce it explicitly)
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "marks" TYPE DECIMAL(5,2)`
    );
    // Add CHECK constraint: marks > 0
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "CHK_questions_marks_positive" CHECK ("marks" > 0)`
    );

    // Also ensure totalMarks on quizzes is DECIMAL(10,2)
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "totalMarks" TYPE DECIMAL(10,2)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "CHK_questions_marks_positive"`
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ALTER COLUMN "marks" TYPE DECIMAL(5,2)`
    );
    await queryRunner.query(
      `ALTER TABLE "quizzes" ALTER COLUMN "totalMarks" TYPE DECIMAL(10,2)`
    );
  }
}
