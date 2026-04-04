import { AxiosInstance } from 'axios';

import { Chapter } from '../../types/graphql.types';

interface ChapterForTtsReview {
  content: string;
  ttsFriendlyContent?: string;
}

export async function fetchChapterForTtsReview(
  api: AxiosInstance,
  novelId: string,
  chapterId: string,
): Promise<ChapterForTtsReview> {
  const response = await api.post('/graphql', {
    query: `#graphql
      query GetChapterForTtsReview($novelId: ID!, $chapterId: ID!) {
        novel(id: $novelId) {
          chapter(id: $chapterId) {
            content
            ttsFriendlyContent
          }
        }
      }
    `,
    variables: { novelId, chapterId },
  });

  return response.data.data.novel.chapter;
}

export async function generateTtsFriendlyText(
  api: AxiosInstance,
  text: string,
): Promise<string> {
  const response = await api.post('/graphql', {
    query: `#graphql
      mutation GenerateTtsFriendlyText($text: String!) {
        generateTtsFriendlyText(text: $text)
      }
    `,
    variables: { text },
  });

  return response.data.data.generateTtsFriendlyText;
}

export async function updateChapterContent(
  api: AxiosInstance,
  chapterId: string,
  content: string,
  ttsFriendlyContent: string,
): Promise<Chapter> {
  const response = await api.post('/graphql', {
    query: `#graphql
      mutation UpdateContent($id: ID!, $content: String!, $ttsFriendlyContent: String!) {
        updateContent(id: $id, content: $content, ttsFriendlyContent: $ttsFriendlyContent) {
          id
          content
          ttsFriendlyContent
        }
      }
    `,
    variables: { id: chapterId, content, ttsFriendlyContent },
  });

  return response.data.data.updateContent;
}
