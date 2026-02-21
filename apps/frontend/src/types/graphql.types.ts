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
  chapter?: Chapter;
}

export enum NovelState {
  FINISHED = 'FINISHED',
  ONGOING = 'ONGOING',
}

export interface Chapter {
  id: string;
  novelId: string;
  title: string | null;
  content: string;
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
  antonyms: string[];
  meaning: string;
  simplifiedExplanation: string;
  synonyms: string[];
}
