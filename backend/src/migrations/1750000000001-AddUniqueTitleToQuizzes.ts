import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueTitleToQuizzes1750000000001 implements MigrationInterface {
  name = 'AddUniqueTitleToQuizzes1750000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique constraint on quizzes.title
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD CONSTRAINT "UQ_quizzes_title" UNIQUE ("title")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP CONSTRAINT "UQ_quizzes_title"`
    );
  }
}
