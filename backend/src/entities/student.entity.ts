import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { QuizAttempt } from './quiz-attempt.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  googleId: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  collegeName: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  yearOfStudy: number;

  @Column({ default: false })
  profileCompleted: boolean;

  @Column({ default: Role.STUDENT })
  role: Role;

  @OneToMany(() => QuizAttempt, (attempt) => attempt.student)
  attempts: QuizAttempt[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
