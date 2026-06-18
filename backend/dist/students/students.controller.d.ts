import { StudentsService } from './students.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { Role } from '../common/enums/role.enum';
export declare class StudentsController {
    private studentsService;
    constructor(studentsService: StudentsService);
    getProfile(user: any): Promise<import("../entities/student.entity").Student> | {
        id: string;
        email: any;
        fullName: string;
        role: Role;
    };
    findAllStudents(): Promise<import("../entities/student.entity").Student[]>;
    completeProfile(user: any, dto: CompleteProfileDto): Promise<import("../entities/student.entity").Student>;
}
