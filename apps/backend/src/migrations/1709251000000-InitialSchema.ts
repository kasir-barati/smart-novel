import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1709251000000 implements MigrationInterface {
  name = 'InitialSchema1709251000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create categories table
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_name" UNIQUE ("name"),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id")
      )
    `);

    // Create novels table
    await queryRunner.query(`
      CREATE TABLE "novels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "author" character varying NOT NULL,
        "description" text NOT NULL,
        "state" character varying NOT NULL DEFAULT 'ONGOING',
        "cover_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_novels" PRIMARY KEY ("id")
      )
    `);

    // Create chapters table
    await queryRunner.query(`
      CREATE TABLE "chapters" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "novel_id" uuid NOT NULL,
        "title" character varying,
        "content" text NOT NULL,
        "filename" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chapters" PRIMARY KEY ("id")
      )
    `);

    // Create junction table for novel-category many-to-many relationship
    await queryRunner.query(`
      CREATE TABLE "novel_categories" (
        "novel_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_novel_categories" PRIMARY KEY ("novel_id", "category_id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_novel_categories_novel" ON "novel_categories" ("novel_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_novel_categories_category" ON "novel_categories" ("category_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chapters_novel" ON "chapters" ("novel_id")
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "chapters"
      ADD CONSTRAINT "FK_chapters_novel"
      FOREIGN KEY ("novel_id")
      REFERENCES "novels"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "novel_categories"
      ADD CONSTRAINT "FK_novel_categories_novel"
      FOREIGN KEY ("novel_id")
      REFERENCES "novels"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "novel_categories"
      ADD CONSTRAINT "FK_novel_categories_category"
      FOREIGN KEY ("category_id")
      REFERENCES "categories"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "novel_categories" DROP CONSTRAINT "FK_novel_categories_category"
    `);

    await queryRunner.query(`
      ALTER TABLE "novel_categories" DROP CONSTRAINT "FK_novel_categories_novel"
    `);

    await queryRunner.query(`
      ALTER TABLE "chapters" DROP CONSTRAINT "FK_chapters_novel"
    `);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_chapters_novel"`);
    await queryRunner.query(
      `DROP INDEX "IDX_novel_categories_category"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_novel_categories_novel"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "novel_categories"`);
    await queryRunner.query(`DROP TABLE "chapters"`);
    await queryRunner.query(`DROP TABLE "novels"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
