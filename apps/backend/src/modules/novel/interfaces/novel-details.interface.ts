import { NovelState } from '../enums';

export interface NovelDetails {
  author: string;
  category: string[];
  id: string;
  name: string;
  state: NovelState;
}
