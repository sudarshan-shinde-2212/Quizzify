import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  instructions: string;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column()
  durationInMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalMarks: number;

  @Column({ default: false })
  isPublished: boolean;

 @ManyToOne(() => Admin, { nullable: false, eager: false })
@JoinColumn({ name: 'createdBy' })
createdBy: Admin;

@Column({ name: 'createdBy' })
createdById: string;

  @OneToMany(() => Question, (q) => q.quiz, { cascade: true })
  questions: Question[];

  @OneToMany(() => QuizAttempt, (a) => a.quiz)
  attempts: QuizAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
