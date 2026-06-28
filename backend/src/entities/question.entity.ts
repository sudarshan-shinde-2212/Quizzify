import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { CorrectOption } from '../common/enums/option.enum';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column()
  optionA: string;

  @Column()
  optionB: string;

  @Column()
  optionC: string;

  @Column()
  optionD: string;

  @Column({ type: 'enum', enum: CorrectOption })
  correctOption: CorrectOption;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  marks: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  negativeMarks: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  difficulty: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
