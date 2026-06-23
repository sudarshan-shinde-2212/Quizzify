import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Quiz } from './quiz.entity';
import { QuizAnswer } from './quiz-answer.entity';
import { QuizResult } from './quiz-result.entity';

@Entity('quiz_attempts')
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, (s) => s.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Quiz, (q) => q.attempts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ default: false })
  isSubmitted: boolean;

  @Column({ default: false })
  isCheating: boolean;

  @OneToMany(() => QuizAnswer, (a) => a.attempt, { cascade: true })
  answers: QuizAnswer[];

  @OneToMany(() => QuizResult, (r) => r.attempt)
  results: QuizResult[];

  @CreateDateColumn()
  createdAt: Date;
}
