import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NovelEntity } from './novel.entity';

@Entity('chapters')
export class ChapterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'novel_id' })
  novelId: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'filename' })
  filename: string;

  @ManyToOne(() => NovelEntity, (novel) => novel.chapters, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'novel_id' })
  novel: NovelEntity;

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
