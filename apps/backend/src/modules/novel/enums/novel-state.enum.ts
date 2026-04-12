import { registerEnumType } from '@nestjs/graphql';

export enum NovelState {
  FINISHED = 'FINISHED',
  ONGOING = 'ONGOING',
} // FIXME: use enum exported from Prisma

registerEnumType(NovelState, {
  name: 'NovelState',
});
