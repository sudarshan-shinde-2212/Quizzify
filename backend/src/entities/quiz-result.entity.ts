import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { QuizAttempt } from './quiz-attempt.entity';
import { Student } from './student.entity';
import { Quiz } from './quiz.entity';

@Entity('quiz_results')
export class QuizResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => QuizAttempt, (a) => a.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attemptId' })
  attempt: QuizAttempt;

  @Column()
  attemptId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quizId' })
  quiz: Quiz;

  @Column()
  quizId: string;

  @Column({ type: 'int' })
  totalQuestions: number;

  @Column({ type: 'int' })
  attemptedQuestions: number;

  @Column({ type: 'int' })
  correctAnswers: number;

  @Column({ type: 'int' })
  wrongAnswers: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  score: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage: number | null;

  @Column({ type: 'boolean', default: false })
  cheatingDetected: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
