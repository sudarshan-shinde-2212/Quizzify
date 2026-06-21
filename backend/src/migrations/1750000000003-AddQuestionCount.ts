import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuestionCount1750000000003 implements MigrationInterface {
  name = 'AddQuestionCount1750000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quizzes" ADD "questionCount" integer NOT NULL DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quizzes" DROP COLUMN "questionCount"`
    );
  }
}
