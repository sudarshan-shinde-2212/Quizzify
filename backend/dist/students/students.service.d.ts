import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';
export declare class StudentsService {
    private studentRepo;
    constructor(studentRepo: Repository<Student>);
    completeProfile(studentId: string, dto: CompleteProfileDto): Promise<Student>;
    findById(id: string): Promise<Student>;
    findAll(): Promise<Student[]>;
}
