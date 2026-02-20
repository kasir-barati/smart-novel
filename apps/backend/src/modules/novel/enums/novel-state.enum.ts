import { registerEnumType } from '@nestjs/graphql';

export enum NovelState {
  FINISHED = 'FINISHED',
  ONGOING = 'ONGOING',
}

registerEnumType(NovelState, {
  name: 'NovelState',
});
