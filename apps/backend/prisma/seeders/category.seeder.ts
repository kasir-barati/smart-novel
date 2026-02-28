import { PrismaClient } from '@prisma/client';
import { isArray, isEmpty } from 'class-validator';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface NovelDetails {
  category: string[];
}

export async function seedCategories(
  prisma: PrismaClient,
  dataPath: string,
): Promise<Map<string, string>> {
  console.log('🔍 Scanning for categories...');

  const categorySet = new Set<string>();
  const novelDirs = await readdir(dataPath, { withFileTypes: true });

  for (const dir of novelDirs) {
    if (!dir.isDirectory()) {
      continue;
    }

    const detailsPath = join(dataPath, dir.name, 'details.json');

    try {
      const detailsContent = await readFile(detailsPath, 'utf-8');
      const details: NovelDetails = JSON.parse(detailsContent);

      if (isEmpty(details.category) || !isArray(details.category)) {
        continue;
      }

      for (const category of details.category) {
        categorySet.add(category.toLowerCase());
      }
    } catch (error) {
      console.warn(
        `⚠️  Could not read details.json for ${dir.name}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const uniqueCategories = Array.from(categorySet);

  console.log(
    `📋 Found ${uniqueCategories.length} unique categories.`,
  );

  const categoryMap = new Map<string, string>();

  if (uniqueCategories.length === 0) {
    console.log('⏭️  No categories to seed');
    return categoryMap;
  }

  try {
    await prisma.category.createMany({
      data: uniqueCategories.map((name) => ({ name })),
      skipDuplicates: true,
    });

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    for (const category of categories) {
      categoryMap.set(category.name, category.id);
    }

    console.log(
      `✅ Seeded ${categories.length} categories successfully`,
    );
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }

  return categoryMap;
}
