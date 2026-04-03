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

  describe('normalizeTtsText', () => {
    describe('silent dialogue', () => {
      it('should convert "......" to "..."', () => {
        const result = uut.normalizeTtsText('"......"');

        expect(result).toBe('...');
      });

      it('should convert "..." to "..."', () => {
        const result = uut.normalizeTtsText('"..."');

        expect(result).toBe('...');
      });

      it('should convert "....??" to "hmm?"', () => {
        const result = uut.normalizeTtsText('"....??"');

        expect(result).toBe('hmm?');
      });

      it('should convert "...?" to "hmm?"', () => {
        const result = uut.normalizeTtsText('"...?"');

        expect(result).toBe('hmm?');
      });

      it('should handle name before silent dialogue', () => {
        const result = uut.normalizeTtsText('Alex "......"');

        expect(result).toBe('Alex ...');
      });

      it('should handle name before confused dialogue', () => {
        const result = uut.normalizeTtsText('Alex "....??"');

        expect(result).toBe('Alex hmm?');
      });
    });

    describe('tilde removal', () => {
      it('should remove tilde after elongated word', () => {
        const result = uut.normalizeTtsText('ahhh~');

        expect(result).toBe('ahh');
      });

      it('should remove tilde before punctuation', () => {
        const result = uut.normalizeTtsText('oooh~!');

        expect(result).toBe('ooh!');
      });

      it('should remove tilde before space', () => {
        const result = uut.normalizeTtsText('ahhh~ yes');

        expect(result).toBe('ahh yes');
      });

      it('should not remove tilde in the middle of text like path~name', () => {
        const result = uut.normalizeTtsText('path~name');

        expect(result).toBe('path~name');
      });
    });

    describe('repeated letter collapsing', () => {
      it('should collapse "ahhhhhhhh" to "ahh"', () => {
        const result = uut.normalizeTtsText('ahhhhhhhh');

        expect(result).toBe('ahh');
      });

      it('should collapse "CRAAAACK" to "craack"', () => {
        const result = uut.normalizeTtsText('CRAAAACK');

        expect(result).toBe('craack');
      });

      it('should collapse "WHOOOOOSH!" to "whoosh!"', () => {
        const result = uut.normalizeTtsText('WHOOOOOSH!');

        expect(result).toBe('whoosh!');
      });

      it('should collapse "FWOOOOSH" to "fwoosh"', () => {
        const result = uut.normalizeTtsText('FWOOOOSH');

        expect(result).toBe('fwoosh');
      });

      it('should collapse "BOOOOOOM" to "boom"', () => {
        const result = uut.normalizeTtsText('BOOOOOOM');

        expect(result).toBe('boom');
      });

      it('should collapse "CRAAAACCKKKK" to "craacckk"', () => {
        const result = uut.normalizeTtsText('CRAAAACCKKKK');

        expect(result).toBe('craacckk');
      });

      it('should collapse "SLAAAAAAM" to "slaam"', () => {
        const result = uut.normalizeTtsText('SLAAAAAAM');

        expect(result).toBe('slaam');
      });

      it('should not collapse normal double letters like "book"', () => {
        const result = uut.normalizeTtsText('book');

        expect(result).toBe('book');
      });

      it('should not collapse normal double letters like "feel"', () => {
        const result = uut.normalizeTtsText('feel');

        expect(result).toBe('feel');
      });

      it('should collapse "whattttt" to "whatt"', () => {
        const result = uut.normalizeTtsText('whattttt');

        expect(result).toBe('whatt');
      });
    });

    describe('excessive dots collapsing', () => {
      it('should collapse "ahhh......" to "ahh..."', () => {
        const result = uut.normalizeTtsText('ahhh......');

        expect(result).toBe('ahh...');
      });

      it('should leave "..." as-is', () => {
        const result = uut.normalizeTtsText('wait...');

        expect(result).toBe('wait...');
      });

      it('should collapse "........" to "..."', () => {
        const result = uut.normalizeTtsText('hmm........');

        expect(result).toBe('hmm...');
      });
    });

    describe('ALL CAPS lowercasing', () => {
      it('should lowercase "CRACK" to "crack"', () => {
        const result = uut.normalizeTtsText('CRACK');

        expect(result).toBe('crack');
      });

      it('should lowercase "BOOM" to "boom"', () => {
        const result = uut.normalizeTtsText('BOOM');

        expect(result).toBe('boom');
      });

      it('should lowercase "BOOM!" to "boom!"', () => {
        const result = uut.normalizeTtsText('BOOM!');

        expect(result).toBe('boom!');
      });

      it('should not lowercase single letter "I"', () => {
        const result = uut.normalizeTtsText('I am fine');

        expect(result).toBe('I am fine');
      });

      it('should not lowercase mixed case "Hello"', () => {
        const result = uut.normalizeTtsText('Hello');

        expect(result).toBe('Hello');
      });

      it('should lowercase multiple ALL CAPS words', () => {
        const result = uut.normalizeTtsText('THE BIG BOOM');

        expect(result).toBe('the big boom');
      });

      it('should lowercase ALL CAPS in context', () => {
        const result = uut.normalizeTtsText(
          'He heard a CRACK and ran',
        );

        expect(result).toBe('He heard a crack and ran');
      });
    });

    describe('stutter / hesitation patterns', () => {
      it('should convert "Wh-What" to "wh... what"', () => {
        const result = uut.normalizeTtsText('Wh-What');

        expect(result).toBe('wh... what');
      });

      it('should convert "W-What" to "w... what"', () => {
        const result = uut.normalizeTtsText('W-What');

        expect(result).toBe('w... what');
      });

      it('should convert "N-No" to "n... no"', () => {
        const result = uut.normalizeTtsText('N-No');

        expect(result).toBe('n... no');
      });

      it('should leave "I-I" unchanged (second part is only 1 char)', () => {
        const result = uut.normalizeTtsText('I-I am OK');

        expect(result).toBe('I-I am ok');
      });

      it('should not convert "well-known" (not a stutter)', () => {
        const result = uut.normalizeTtsText('well-known');

        expect(result).toBe('well-known');
      });

      it('should not convert "twenty-one" (not a stutter)', () => {
        const result = uut.normalizeTtsText('twenty-one');

        expect(result).toBe('twenty-one');
      });

      it('should convert "Th-That" to "th... that"', () => {
        const result = uut.normalizeTtsText('Th-That');

        expect(result).toBe('th... that');
      });

      it('should convert "S-Stop it" to "s... stop it"', () => {
        const result = uut.normalizeTtsText('S-Stop it');

        expect(result).toBe('s... stop it');
      });
    });

    describe('square brackets (skill/ability markers)', () => {
      it('should replace "[Boost]" with ", Boost,"', () => {
        const result = uut.normalizeTtsText('She activated [Boost]');

        expect(result).toBe('She activated , Boost,');
      });

      it('should replace "【Fireball】" with ", Fireball,"', () => {
        const result = uut.normalizeTtsText('He cast 【Fireball】');

        expect(result).toBe('He cast , Fireball,');
      });

      it('should replace "[DIVINE SHIELD]" and lowercase the caps', () => {
        const result = uut.normalizeTtsText('[DIVINE SHIELD]');

        expect(result).toBe(', divine shield,');
      });

      it('should handle multiple bracket skills', () => {
        const result = uut.normalizeTtsText(
          'Used [Boost] and [Shield]',
        );

        expect(result).toBe('Used , Boost, and , Shield,');
      });
    });

    describe('repeated single words', () => {
      it('should collapse "run run run run run run" to "run, run, run"', () => {
        const result = uut.normalizeTtsText(
          'run run run run run run',
        );

        expect(result).toBe('run, run, run');
      });

      it('should collapse "no no no no no no" to "no, no, no"', () => {
        const result = uut.normalizeTtsText('no no no no no no');

        expect(result).toBe('no, no, no');
      });

      it('should not collapse "no no" (only 2 repetitions)', () => {
        const result = uut.normalizeTtsText('no no');

        expect(result).toBe('no no');
      });

      it('should not collapse "no no no" (only 3 repetitions)', () => {
        const result = uut.normalizeTtsText('no no no');

        expect(result).toBe('no no no');
      });

      it('should collapse 4 repetitions', () => {
        const result = uut.normalizeTtsText('run run run run');

        expect(result).toBe('run, run, run');
      });

      it('should collapse ALL CAPS repeated words and lowercase them', () => {
        const result = uut.normalizeTtsText('RUN RUN RUN RUN RUN');

        expect(result).toBe('run, run, run');
      });
    });

    describe('repeated multi-word phrases', () => {
      it('should collapse repeated 5-word phrases', () => {
        const result = uut.normalizeTtsText(
          'I do not wanna die I do not wanna die I do not wanna die I do not wanna die I do not wanna die',
        );

        expect(result).toBe(
          'I do not wanna die, I do not wanna die, I do not wanna die',
        );
      });

      it('should collapse repeated 2-word phrases', () => {
        const result = uut.normalizeTtsText(
          'help me help me help me help me help me',
        );

        expect(result).toBe('help me, help me, help me');
      });

      it('should not collapse 3 repetitions of a phrase', () => {
        const result = uut.normalizeTtsText(
          'help me help me help me',
        );

        expect(result).toBe('help me help me help me');
      });
    });

    describe('combined transformations', () => {
      it('should handle tilde + repeated letters', () => {
        const result = uut.normalizeTtsText('ahhh~');

        expect(result).toBe('ahh');
      });

      it('should handle elongated ALL CAPS onomatopoeia with punctuation', () => {
        const result = uut.normalizeTtsText('CRAAAACCKKKK!');

        expect(result).toBe('craacckk!');
      });

      it('should handle multiple transformations in a sentence', () => {
        const result = uut.normalizeTtsText(
          'W-What was that?! BOOM! The [Fireball] exploded!',
        );

        expect(result).toContain('w... what');
        expect(result).toContain('boom!');
        expect(result).toContain(', Fireball,');
      });

      it('should handle complex manga dialogue', () => {
        const result = uut.normalizeTtsText(
          'Alex "...?" N-No way... CRAAAACK!',
        );

        expect(result).toContain('hmm?');
        expect(result).toContain('n... no');
        expect(result).toContain('craack!');
      });

      it('should handle ahhh... pattern', () => {
        const result = uut.normalizeTtsText('ahhh...');

        expect(result).toBe('ahh...');
      });

      it('should not alter normal prose', () => {
        const input = 'Elena walked through the forest carefully.';

        const result = uut.normalizeTtsText(input);

        expect(result).toBe(input);
      });

      it('should preserve normal sentences with standard punctuation', () => {
        const input = 'He said, "I will be back." She nodded.';

        const result = uut.normalizeTtsText(input);

        expect(result).toBe(input);
      });
    });
  });
});
