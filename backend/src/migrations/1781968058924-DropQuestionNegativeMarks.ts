import { MigrationInterface, QueryRunner } from "typeorm";

export class DropQuestionNegativeMarks1781968058924 implements MigrationInterface {
    name = 'DropQuestionNegativeMarks1781968058924';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Safety: column may have already been dropped manually
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "negativeMarks"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-add the column so rollback is non-destructive
        await queryRunner.query(
            `ALTER TABLE "questions" ADD COLUMN "negativeMarks" decimal(5,2) DEFAULT 0`
        );
    }
}
