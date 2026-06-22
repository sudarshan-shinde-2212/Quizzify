import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuizSettings1781968058927 implements MigrationInterface {
    name = 'AddQuizSettings1781968058927';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            ADD COLUMN "allowRetakes" boolean NOT NULL DEFAULT false,
            ADD COLUMN "shuffleQuestions" boolean NOT NULL DEFAULT true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "quizzes" 
            DROP COLUMN "allowRetakes",
            DROP COLUMN "shuffleQuestions"
        `);
    }
}
