import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NovelState } from '../enums';
import { CategoryEntity } from './category.entity';
import { ChapterEntity } from './chapter.entity';

@Entity('novels')
export class NovelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  author: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: NovelState,
    default: NovelState.ONGOING,
  })
  state: NovelState;

  @Column({ nullable: true, name: 'cover_url' })
  coverUrl?: string;

  @ManyToMany(() => CategoryEntity, (category) => category.novels, {
    cascade: true,
  })
  @JoinTable({
    name: 'novel_categories',
    joinColumn: { name: 'novel_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'category_id',
      referencedColumnName: 'id',
    },
  })
  categories: CategoryEntity[];

  @OneToMany(() => ChapterEntity, (chapter) => chapter.novel)
  chapters: ChapterEntity[];

  @CreateDateColumn({
    type: 'timestamptz',
    name: 'created_at',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value?.toISOString(),
    },
  })
  createdAt: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    name: 'updated_at',
    transformer: {
      to: (value: Date) => value,
      from: (value: Date) => value?.toISOString(),
    },
  })
  updatedAt: string;
}
