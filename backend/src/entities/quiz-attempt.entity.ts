import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Quiz } from './quiz.entity';
import { QuizAnswer } from './quiz-answer.entity';
import { QuizResult } from './quiz-result.entity';

export enum ViolationType {
  TAB_SWITCH = 'TAB_SWITCH',
  WINDOW_BLUR = 'WINDOW_BLUR',
  VISIBILITY_CHANGE = 'VISIBILITY_CHANGE',
  COPY_PASTE = 'COPY_PASTE',
  SCREENSHOT = 'SCREENSHOT',
  DEV_TOOLS = 'DEV_TOOLS',
  CONTEXT_MENU = 'CONTEXT_MENU',
  KEYBOARD_SHORTCUT = 'KEYBOARD_SHORTCUT',
}

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

  // New fields for advanced anti-cheating
  @Column({ type: 'int', default: 0 })
  warningCount: number;

  @Column({ type: 'int', default: 0 })
  violationCount: number;

  @Column({ type: 'simple-array', nullable: true })
  violationTypes: string[];

  @Column({ type: 'simple-array', nullable: true })
  violationTimestamps: string[];

  @Column({ type: 'text', nullable: true })
  disqualificationReason: string;

  @OneToMany(() => QuizAnswer, (a) => a.attempt, { cascade: true })
  answers: QuizAnswer[];

  @OneToMany(() => QuizResult, (r) => r.attempt)
  results: QuizResult[];

  @CreateDateColumn()
  createdAt: Date;
}
