import { registerEnumType } from '@nestjs/graphql';

export enum NovelAction {
  MANAGE_TTS = 'MANAGE_TTS',
}

registerEnumType(NovelAction, {
  name: 'NovelAction',
  description: 'Actions a user can perform on a novel',
});
