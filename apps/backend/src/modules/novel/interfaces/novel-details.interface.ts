import { NovelState } from '../enums';

export interface NovelDetails {
  author: string;
  category: string[];
  coverUrl?: string;
  /** @description As of now this is the directory name inside the data folder */
  id: string;
  name: string;
  state: NovelState;
}
