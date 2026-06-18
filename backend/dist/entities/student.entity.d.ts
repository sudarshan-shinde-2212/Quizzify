import { Role } from '../common/enums/role.enum';
import { QuizAttempt } from './quiz-attempt.entity';
export declare class Student {
    id: string;
    googleId: string;
    email: string;
    fullName: string;
    phoneNumber: string;
    collegeName: string;
    department: string;
    yearOfStudy: number;
    profileCompleted: boolean;
    role: Role;
    attempts: QuizAttempt[];
    createdAt: Date;
    updatedAt: Date;
}
