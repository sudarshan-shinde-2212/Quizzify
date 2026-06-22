import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuizVisibility1781968058925 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "quiz_visibility_enum" AS ENUM ('public', 'private');
        `);
        await queryRunner.query(`
            ALTER TABLE "quizzes" ADD COLUMN "visibility" "quiz_visibility_enum" DEFAULT 'private' NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quizzes" DROP COLUMN "visibility"`);
        await queryRunner.query(`DROP TYPE "quiz_visibility_enum"`);
    }
}
