import { NotFoundException } from '@nestjs/common';

import { NovelState } from './enums';
import { NovelService } from './novel.service';
import { type INovelRepository } from './repositories';
import { Chapter, Novel } from './types';

describe(NovelService.name, () => {
  let uut: NovelService;
  let novelRepository: jest.Mocked<INovelRepository>;

  beforeEach(() => {
    novelRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      getChapter: jest.fn(),
    };

    uut = new NovelService(novelRepository);
  });

  it('should return a novel when id exists', async () => {
    const novel: Novel = {
      author: `Great Calamity Of Fire`,
      category: [
        'action',
        'comedy',
        'fantasy',
        'horror',
        'mystery',
        'psychological',
        'supernatural',
      ],
      chapters: ['chapter1.md'],
      id: 'i-am-really-not-the-demon-gods-lackey',
      name: "I'm Really Not The Demon God's Lackey",
      state: NovelState.ONGOING,
    };
    novelRepository.findById.mockResolvedValue(novel);

    const result = await uut.findOne('novel-1');

    expect(result).toEqual(novel);
    expect(novelRepository.findById).toHaveBeenCalledWith('novel-1');
  });

  it('should throw NotFoundException when id does not exist', async () => {
    novelRepository.findById.mockResolvedValue(null);

    await expect(uut.findOne('missing-id')).rejects.toThrow(
      new NotFoundException('Novel with id missing-id not found'),
    );
  });

  it('should return chapter from repository', async () => {
    const chapter: Chapter = {
      content: '# Chapter 1',
      createdAt: new Date('2024-01-01'),
      title: 'Chapter 1',
      id: 'chapter1.md',
      updatedAt: new Date('2024-01-02'),
    };
    novelRepository.getChapter.mockResolvedValue(chapter);

    const result = await uut.getChapter('novel-1', 'chapter1.md');

    expect(result).toEqual(chapter);
    expect(novelRepository.getChapter).toHaveBeenCalledWith(
      'novel-1',
      'chapter1.md',
    );
  });
});
