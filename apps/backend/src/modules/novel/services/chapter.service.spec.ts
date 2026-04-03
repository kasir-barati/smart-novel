import { NotFoundException } from '@nestjs/common';

import type {
  IChapterContentRepository,
  IChapterRepository,
} from '../interfaces';

import { ChapterService } from './chapter.service';

describe(ChapterService.name, () => {
  let uut: ChapterService;
  let chapterRepository: IChapterRepository;
  let chapterContentRepository: IChapterContentRepository;

  const CHAPTER_ID = 'test-chapter-id';

  function mockContentByChapterId(content: string) {
    vi.mocked(
      chapterContentRepository.findByChapterId,
    ).mockResolvedValue({
      id: 'content-id',
      content,
      contentHash: 'hash',
    });
  }

  beforeEach(() => {
    chapterRepository = {
      findById: vi.fn(),
      getChapter: vi.fn(),
      updateNarrationStatus: vi.fn(),
      updateChapterNarrationUrl: vi.fn(),
      updateChapterNarrationComplete: vi.fn(),
    };

    chapterContentRepository = {
      findByIds: vi.fn(),
      findByChapterId: vi.fn(),
      upsertByChapterId: vi.fn(),
    };

    uut = new ChapterService(
      chapterRepository,
      chapterContentRepository,
    );
  });

  describe('updateContent', () => {
    it("should update the chapter's content via content repository", async () => {
      vi.mocked(chapterRepository.findById).mockResolvedValue({
        id: '4bbc4da9-107c-4872-9809-78f6191a092d',
        novelId: '4754496a-ccb4-4a6b-805d-809a6cea97c8',
        contentId: 'fdba9d1b-32db-4b18-85c4-a5f2e680dcec',
        title: 'Chapter 1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      vi.mocked(
        chapterContentRepository.upsertByChapterId,
      ).mockResolvedValue({
        id: 'fdba9d1b-32db-4b18-85c4-a5f2e680dcec',
        content: '# Chapter 1\n\nHooray',
        contentHash: 'hash',
      });

      const res = await uut.updateContent(
        '4bbc4da9-107c-4872-9809-78f6191a092d',
        '# Chapter 1\n\nHooray',
        'Chapter 1\n\nHooray',
      );

      expect(
        chapterContentRepository.upsertByChapterId,
      ).toHaveBeenCalledWith(
        '4bbc4da9-107c-4872-9809-78f6191a092d',
        '# Chapter 1\n\nHooray',
        'Chapter 1\n\nHooray',
      );
      expect(res.contentId).toBe(
        'fdba9d1b-32db-4b18-85c4-a5f2e680dcec',
      );
    });

    it('should raise an exception if chapter does NOT exist', async () => {
      vi.mocked(chapterRepository.findById).mockResolvedValue(null);

      const res = uut.updateContent(
        '761ba2ab-8d2f-46b0-8cf2-11f072be3bba',
        '# Chapter 1\n\nHello',
        'Chapter 1\n\nHello',
      );

      await expect(res).rejects.toThrow(NotFoundException);
    });
  });

  describe('convertToTtsFriendly', () => {
    describe('silent dialogue', () => {
      it('should convert "......" to "..."', async () => {
        mockContentByChapterId('"......"');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('...');
      });

      it('should convert "..." to "..."', async () => {
        mockContentByChapterId('"..."');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('...');
      });

      it('should convert "....??" to "hmm?"', async () => {
        mockContentByChapterId('"....??"');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('hmm?');
      });

      it('should convert "...?" to "hmm?"', async () => {
        mockContentByChapterId('"...?"');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('hmm?');
      });

      it('should handle name before silent dialogue', async () => {
        mockContentByChapterId('Alex "......"');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('Alex ...');
      });

      it('should handle name before confused dialogue', async () => {
        mockContentByChapterId('Alex "....??"');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('Alex hmm?');
      });
    });

    describe('tilde removal', () => {
      it('should remove tilde after elongated word', async () => {
        mockContentByChapterId('ahhh~');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('ahh');
      });

      it('should remove tilde before punctuation', async () => {
        mockContentByChapterId('oooh~!');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('ooh!');
      });

      it('should remove tilde before space', async () => {
        mockContentByChapterId('ahhh~ yes');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('ahh yes');
      });

      it('should not remove tilde in the middle of text like path~name', async () => {
        mockContentByChapterId('path~name');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('path~name');
      });
    });

    describe('repeated letter collapsing', () => {
      it('should collapse "ahhhhhhhh" to "ahh"', async () => {
        mockContentByChapterId('ahhhhhhhh');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('ahh');
      });

      it('should collapse "CRAAAACK" to "craack"', async () => {
        mockContentByChapterId('CRAAAACK');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('craack');
      });

      it('should collapse "WHOOOOOSH!" to "whoosh!"', async () => {
        mockContentByChapterId('WHOOOOOSH!');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('whoosh!');
      });

      it('should collapse "FWOOOOSH" to "fwoosh"', async () => {
        mockContentByChapterId('FWOOOOSH');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('fwoosh');
      });

      it('should collapse "BOOOOOOM" to "boom"', async () => {
        mockContentByChapterId('BOOOOOOM');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('boom');
      });

      it('should collapse "CRAAAACCKKKK" to "craacckk"', async () => {
        mockContentByChapterId('CRAAAACCKKKK');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('craacckk');
      });

      it('should collapse "SLAAAAAAM" to "slaam"', async () => {
        mockContentByChapterId('SLAAAAAAM');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('slaam');
      });

      it('should not collapse normal double letters like "book"', async () => {
        mockContentByChapterId('book');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('book');
      });

      it('should not collapse normal double letters like "feel"', async () => {
        mockContentByChapterId('feel');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('feel');
      });

      it('should collapse "whattttt" to "whatt"', async () => {
        mockContentByChapterId('whattttt');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('whatt');
      });
    });

    describe('excessive dots collapsing', () => {
      it('should collapse "ahhh......" to "ahh..."', async () => {
        mockContentByChapterId('ahhh......');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('ahh...');
      });

      it('should leave "..." as-is', async () => {
        mockContentByChapterId('wait...');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('wait...');
      });

      it('should collapse "........" to "..."', async () => {
        mockContentByChapterId('hmm........');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('hmm...');
      });
    });

    describe('ALL CAPS lowercasing', () => {
      it('should lowercase "CRACK" to "crack"', async () => {
        mockContentByChapterId('CRACK');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('crack');
      });

      it('should lowercase "BOOM" to "boom"', async () => {
        mockContentByChapterId('BOOM');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('boom');
      });

      it('should lowercase "BOOM!" to "boom!"', async () => {
        mockContentByChapterId('BOOM!');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('boom!');
      });

      it('should not lowercase single letter "I"', async () => {
        mockContentByChapterId('I am fine');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('I am fine');
      });

      it('should not lowercase mixed case "Hello"', async () => {
        mockContentByChapterId('Hello');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('Hello');
      });

      it('should lowercase multiple ALL CAPS words', async () => {
        mockContentByChapterId('THE BIG BOOM');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('the big boom');
      });

      it('should lowercase ALL CAPS in context', async () => {
        mockContentByChapterId('He heard a CRACK and ran');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('He heard a crack and ran');
      });
    });

    describe('stutter / hesitation patterns', () => {
      it('should convert "Wh-What" to "wh... what"', async () => {
        mockContentByChapterId('Wh-What');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('wh... what');
      });

      it('should convert "W-What" to "w... what"', async () => {
        mockContentByChapterId('W-What');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('w... what');
      });

      it('should convert "N-No" to "n... no"', async () => {
        mockContentByChapterId('N-No');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('n... no');
      });

      it('should leave "I-I" unchanged (second part is only 1 char)', async () => {
        mockContentByChapterId('I-I am OK');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('I-I am ok');
      });

      it('should not convert "well-known" (not a stutter)', async () => {
        mockContentByChapterId('well-known');
        const res = await uut.convertToTtsFriendly(CHAPTER_ID);
        expect(res).toBe('well-known');
      });

      it('should not convert "twenty-one" (not a stutter)', async () => {
        mockContentByChapterId('twenty-one');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('twenty-one');
      });

      it('should convert "Th-That" to "th... that"', async () => {
        mockContentByChapterId('Th-That');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('th... that');
      });

      it('should convert "S-Stop it" to "s... stop it"', async () => {
        mockContentByChapterId('S-Stop it');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('s... stop it');
      });
    });

    describe('square brackets (skill/ability markers)', () => {
      it('should replace "[Boost]" with ", Boost,"', async () => {
        mockContentByChapterId('She activated [Boost]');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('She activated , Boost,');
      });

      it('should replace "【Fireball】" with ", Fireball,"', async () => {
        mockContentByChapterId('He cast 【Fireball】');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('He cast , Fireball,');
      });

      it('should replace "[DIVINE SHIELD]" and lowercase the caps', async () => {
        mockContentByChapterId('[DIVINE SHIELD]');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe(', divine shield,');
      });

      it('should handle multiple bracket skills', async () => {
        mockContentByChapterId('Used [Boost] and [Shield]');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('Used , Boost, and , Shield,');
      });
    });

    describe('repeated single words', () => {
      it('should collapse "run run run run run run" to "run, run, run"', async () => {
        mockContentByChapterId('run run run run run run');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('run, run, run');
      });

      it('should collapse "no no no no no no" to "no, no, no"', async () => {
        mockContentByChapterId('no no no no no no');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('no, no, no');
      });

      it('should not collapse "no no" (only 2 repetitions)', async () => {
        mockContentByChapterId('no no');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('no no');
      });

      it('should not collapse "no no no" (only 3 repetitions)', async () => {
        mockContentByChapterId('no no no');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('no no no');
      });

      it('should collapse 4 repetitions', async () => {
        mockContentByChapterId('run run run run');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('run, run, run');
      });

      it('should collapse ALL CAPS repeated words and lowercase them', async () => {
        mockContentByChapterId('RUN RUN RUN RUN RUN');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('run, run, run');
      });
    });

    describe('repeated multi-word phrases', () => {
      it('should collapse repeated 5-word phrases', async () => {
        const input =
          'I do not wanna die I do not wanna die I do not wanna die I do not wanna die I do not wanna die';
        mockContentByChapterId(input);

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe(
          'I do not wanna die, I do not wanna die, I do not wanna die',
        );
      });

      it('should collapse repeated 2-word phrases', async () => {
        const input = 'help me help me help me help me help me';
        mockContentByChapterId(input);

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('help me, help me, help me');
      });

      it('should not collapse 3 repetitions of a phrase', async () => {
        const input = 'help me help me help me';
        mockContentByChapterId(input);

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('help me help me help me');
      });
    });

    describe('combined transformations', () => {
      it('should handle tilde + repeated letters', async () => {
        mockContentByChapterId('ahhh~');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('ahh');
      });

      it('should handle elongated ALL CAPS onomatopoeia with punctuation', async () => {
        mockContentByChapterId('CRAAAACCKKKK!');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('craacckk!');
      });

      it('should handle multiple transformations in a sentence', async () => {
        mockContentByChapterId(
          'W-What was that?! BOOM! The [Fireball] exploded!',
        );

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toContain('w... what');
        expect(res).toContain('boom!');
        expect(res).toContain(', Fireball,');
      });

      it('should handle complex manga dialogue', async () => {
        mockContentByChapterId('Alex "...?" N-No way... CRAAAACK!');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toContain('hmm?');
        expect(res).toContain('n... no');
        expect(res).toContain('craack!');
      });

      it('should handle ahhh... pattern', async () => {
        mockContentByChapterId('ahhh...');

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe('ahh...');
      });

      it('should not alter normal prose', async () => {
        const input = 'Elena walked through the forest carefully.';
        mockContentByChapterId(input);

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe(input);
      });

      it('should preserve normal sentences with standard punctuation', async () => {
        const input = 'He said, "I will be back." She nodded.';
        mockContentByChapterId(input);

        const res = await uut.convertToTtsFriendly(CHAPTER_ID);

        expect(res).toBe(input);
      });
    });
  });
});
