import { NarrationStatus } from '@prisma/client';
import axios from 'axios';
import { retryAsync } from 'nestjs-backend-common';
import { execSync } from 'node:child_process';
import path from 'node:path';

interface TtsLogEntry {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  context: string;
  correlationId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
}

export class ChapterNarrationFixture {
  private workspaceRoot: string;
  private testStartTime: Date;

  constructor() {
    this.workspaceRoot = path.resolve(__dirname, '../../../../');
    this.testStartTime = new Date();
  }

  async waitFor(
    novelId: string,
    chapterId: string,
    toBe: NarrationStatus,
  ): Promise<string> {
    const maxAttempts = 15;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusRes = await axios.post('/graphql', {
        query: `#graphql
          query GetChapter($novelId: ID!, $chapterId: ID!) {
            novel(id: $novelId) {
              chapter(id: $chapterId) {
                id
                narrationStatus
                narrationUrl
              }
            }
          }
        `,
        variables: {
          novelId,
          chapterId,
        },
      });
      const status =
        statusRes.data.data.novel.chapter.narrationStatus;
      if (status === 'READY') {
        return statusRes.data.data.novel.chapter.narrationUrl;
      }

      if (status === 'FAILED') {
        throw new Error('Narration generation failed');
      }
    }

    throw new Error('Narration generation timed out');
  }

  generateChapterAudio(chapterId: string) {
    return axios.post('/graphql', {
      query: `#graphql
        mutation GenerateChapterAudio($chapterId: ID!) {
          generateChapterAudio(chapterId: $chapterId) {
            status
            narrationUrl
          }
        }
      `,
      variables: {
        chapterId,
      },
    });
  }

  beforeEach(): void {
    // Mark the start of a test to capture logs from this point forward
    this.testStartTime = new Date();
  }

  /**
   * Asserts that a correlation ID appears exactly once in TTS logs
   */
  async thenTtsCalledOnceWith(correlationId: string) {
    const logs = await this.getTtsLogs();
    const counts = await this.getCorrelationIdCounts(logs);
    const count = counts.get(correlationId) || 0;

    expect(count).toBe(1);
  }

  /**
   * Asserts that a correlation ID does NOT appear in TTS logs
   */
  async thenTtsNotCalledWith(correlationId: string) {
    const logs = await this.getTtsLogs();
    const counts = await this.getCorrelationIdCounts(logs);
    const count = counts.get(correlationId) || 0;

    expect(count).toBe(0);
  }

  private async getCorrelationIdCounts(
    logs: TtsLogEntry[],
  ): Promise<Map<string, number>> {
    const correlationIds = this.extractCorrelationIds(logs);
    const counts = new Map<string, number>();

    for (const id of correlationIds) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    return counts;
  }

  /**
   * Extract correlation IDs from TTS request logs
   */
  private extractCorrelationIds(entries: TtsLogEntry[]): string[] {
    return entries
      .filter(
        (entry) =>
          entry.correlationId &&
          entry.message?.includes('Incoming POST') &&
          entry.url === '/speak',
      )
      .map((entry) => entry.correlationId as string);
  }

  /**
   * Get TTS log entries from TTS container since the test started
   */
  private async getTtsLogs(): Promise<TtsLogEntry[]> {
    /** @description timestamp format for Docker (RFC3339) */
    const sinceTime = this.testStartTime.toISOString();
    const [error, rawLogs] = await retryAsync(
      async () =>
        execSync(
          `docker compose logs tts --since ${sinceTime} --no-log-prefix`,
          {
            cwd: this.workspaceRoot,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'], // <== pipes stdin, stdout, stderr to this subprocess so we can capture container's logs
          },
        ),
      { retry: 0 },
    );

    if (error) {
      console.error('Error fetching TTS logs:', error);
      return [];
    }

    const lines = rawLogs.split('\n').filter((line) => line.trim());
    const entries: TtsLogEntry[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as TtsLogEntry;
        entries.push(parsed);
      } catch {
        // Skip non-JSON lines
      }
    }

    return entries;
  }
}
