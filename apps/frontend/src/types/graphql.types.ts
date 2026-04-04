// GraphQL Types
export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
}

export interface Novel {
  id: string;
  name: string;
  author: string;
  category: string[];
  chapters: string[];
  state: NovelState;
  coverUrl?: string;
  description: string;
  allowedActions: NovelAction[];
  chapter?: Chapter;
  lastChapterPublishedAt?: string;
  lastPublishedChapter?: Chapter;
  firstChapter?: Chapter;
}

export enum NovelState {
  FINISHED = 'FINISHED',
  ONGOING = 'ONGOING',
}

export enum NovelAction {
  MANAGE_TTS = 'MANAGE_TTS',
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string | null;
  content: string;
  ttsFriendlyContent?: string;
  createdAt: string;
  updatedAt: string;
  next?: Chapter;
  previous?: Chapter;
}

export interface NovelEdge {
  cursor: string;
  node: Novel;
}

export interface NovelConnection {
  edges: NovelEdge[];
  pageInfo: PageInfo;
}

export interface NovelFiltersInput {
  category?: StringListFilterInput;
}

export interface StringListFilterInput {
  in?: string[];
  nin?: string[];
}

export interface WordExplanation {
  cacheKey: string;
  antonyms: string[];
  meaning: string;
  simplifiedExplanation: string;
  synonyms: string[];
}
