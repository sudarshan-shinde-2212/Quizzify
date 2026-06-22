import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameQuestionText1781968058926 implements MigrationInterface {
    name = 'RenameQuestionText1781968058926';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "questions"
            RENAME COLUMN "questionText" TO "text"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "questions"
            RENAME COLUMN "text" TO "questionText"
        `);
    }
}
