import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Admin } from '../../entities/admin.entity';
import { Student } from '../../entities/student.entity';
import { Role } from '../../common/enums/role.enum';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private adminRepo;
    private studentRepo;
    constructor(configService: ConfigService, adminRepo: Repository<Admin>, studentRepo: Repository<Student>);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        role: Role;
    }>;
}
export {};
