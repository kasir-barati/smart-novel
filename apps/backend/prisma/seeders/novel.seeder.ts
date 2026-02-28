import { PrismaClient } from '@prisma/client';
import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';
import { join } from 'path';

type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

interface NovelDetails {
  databaseId: string;
  id: string;
  name: string;
  description: string;
  author: string;
  category: string[];
  state: 'ONGOING' | 'FINISHED';
  coverUrl?: string;
}

interface ChapterFrontmatter {
  id: string;
  title: string;
}

interface ChapterData {
  id: string;
  title: string;
  content: string;
  chapterNumber: number;
}

const BATCH_SIZE = 500;

function extractChapterNumber(filename: string): number {
  const match = filename.match(/chapter(\d+)\.md$/i);

  if (!match) {
    throw new Error(
      `Could not extract chapter number from filename: ${filename}`,
    );
  }

  return parseInt(match[1], 10);
}

async function loadChapters(
  novelPath: string,
): Promise<ChapterData[]> {
  const files = await readdir(novelPath);
  const chapterFiles = files.filter((f) =>
    f.match(/chapter\d+\.md$/i),
  );

  const chapters: ChapterData[] = [];

  for (const filename of chapterFiles) {
    const filePath = join(novelPath, filename);
    const fileContent = await readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const frontmatter = data as ChapterFrontmatter;

    if (!frontmatter.id) {
      throw new Error(
        `Chapter ${filename} is missing 'id' in frontmatter`,
      );
    }

    chapters.push({
      id: frontmatter.id,
      title: frontmatter.title,
      content: content.trim(),
      chapterNumber: extractChapterNumber(filename),
    });
  }

  // Sort by chapter number to ensure correct order
  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

  return chapters;
}

async function batchInsertChapters(
  prisma: PrismaTransactionClient,
  novelId: string,
  chapters: ChapterData[],
): Promise<void> {
  // Split chapters into batches
  for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
    const batch = chapters.slice(i, i + BATCH_SIZE);

    await prisma.chapter.createMany({
      data: batch.map((chapter) => ({
        id: chapter.id,
        novelId,
        title: chapter.title,
        content: chapter.content,
        chapterNumber: chapter.chapterNumber,
      })),
      skipDuplicates: true,
    });
  }
}

export async function seedNovels(
  prisma: PrismaClient,
  dataPath: string,
  categoryMap: Map<string, string>,
): Promise<void> {
  console.log('\n📚 Processing novels...');

  const novelDirs = await readdir(dataPath, { withFileTypes: true });
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const dir of novelDirs) {
    if (!dir.isDirectory()) {
      continue;
    }

    const novelPath = join(dataPath, dir.name);
    const detailsPath = join(novelPath, 'details.json');

    try {
      const detailsContent = await readFile(detailsPath, 'utf-8');
      const details: NovelDetails = JSON.parse(detailsContent);

      console.log(`\n📖 Processing novel: "${details.name}"`);

      if (!details.databaseId) {
        throw new Error(
          'Novel is missing databaseId in details.json',
        );
      }

      const chapters = await loadChapters(novelPath);
      console.log(`   Found ${chapters.length} chapters`);

      const categoryIds = details.category
        .map((category) => categoryMap.get(category.toLowerCase()))
        .filter((id): id is string => id !== undefined);

      if (categoryIds.length !== details.category.length) {
        console.warn(`   ⚠️  Some categories not found in database`);
      }

      await prisma.$transaction(async (tx) => {
        await tx.novel.create({
          data: {
            id: details.databaseId,
            name: details.name,
            author: details.author,
            description: details.description,
            state: details.state,
            coverUrl: details.coverUrl,
          },
        });

        await batchInsertChapters(tx, details.databaseId, chapters);

        if (categoryIds.length === 0) {
          return;
        }

        await tx.novelCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            novelId: details.databaseId,
            categoryId,
          })),
          skipDuplicates: true,
        });
      });

      console.log(
        `   ✅ Successfully seeded "${details.name}" with ${chapters.length} chapters`,
      );
      successCount++;
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        console.log(`   ⏭️  Novel already exists, skipping...`);
        skipCount++;
        continue;
      }

      console.error(
        `   ❌ Error seeding novel in ${dir.name}:`,
        error,
      );
      errorCount++;
    }
  }

  console.log('\n📊 Novel seeding summary:');
  console.log(`   ✅ Successfully seeded: ${successCount}`);
  console.log(`   ⏭️  Skipped (already exist): ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}
