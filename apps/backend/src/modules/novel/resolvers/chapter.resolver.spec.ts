import type { ChapterService, TtsTextService } from '../services';

import { ChapterResolver } from './chapter.resolver';

describe(ChapterResolver.name, () => {
  let uut: ChapterResolver;
  let chapterService: ChapterService;
  let ttsTextService: TtsTextService;

  beforeEach(() => {
    chapterService = {
      updateContent: vi.fn(),
    } as any;
    ttsTextService = {
      toSpeechText: vi.fn(),
      normalizeTtsText: vi.fn(),
    } as any;

    uut = new ChapterResolver(chapterService, ttsTextService);
  });

  it('should generate TTS-friendly text', async () => {
    vi.mocked(ttsTextService.toSpeechText).mockResolvedValue(
      'Hello World',
    );
    vi.mocked(ttsTextService.normalizeTtsText).mockReturnValue(
      'Hello World',
    );

    await uut.generateTtsFriendlyText('# Hello World');

    expect(ttsTextService.toSpeechText).toHaveBeenCalledWith(
      '# Hello World',
    );
    expect(ttsTextService.normalizeTtsText).toHaveBeenCalledWith(
      'Hello World',
    );
  });
});
