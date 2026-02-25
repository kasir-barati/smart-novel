import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NovelEntity } from './novel.entity';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => NovelEntity, (novel) => novel.categories)
  novels: NovelEntity[];

  @CreateDateColumn({
    type: 'timestamptz',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value?.toISOString(),
    },
  })
  createdAt: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value?.toISOString(),
    },
  })
  updatedAt: string;
}
