import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { QuizAttempt } from './quiz-attempt.entity';
import { Question } from './question.entity';
import { CorrectOption } from '../common/enums/option.enum';

@Entity('quiz_answers')
export class QuizAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuizAttempt, (a) => a.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: QuizAttempt;

  @Column()
  attemptId: string;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column()
  questionId: string;

  @Column({ type: 'enum', enum: CorrectOption })
  selectedOption: CorrectOption;

  @CreateDateColumn()
  createdAt: Date;
}
