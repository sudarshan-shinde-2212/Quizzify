import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../entities/admin.entity';
import { Student } from '../entities/student.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Role } from '../common/enums/role.enum';
export declare class AuthService {
    private adminRepo;
    private studentRepo;
    private jwtService;
    constructor(adminRepo: Repository<Admin>, studentRepo: Repository<Student>, jwtService: JwtService);
    adminLogin(dto: AdminLoginDto): Promise<{
        accessToken: string;
        role: Role;
    }>;
    googleLogin(googleUser: {
        googleId: string;
        email: string;
        fullName: string;
    }): Promise<{
        accessToken: string;
        role: Role;
        profileCompleted: boolean;
    }>;
    private signToken;
    seedAdmin(email: string, password: string): Promise<Admin>;
}
