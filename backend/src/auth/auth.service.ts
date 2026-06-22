import {
  Injectable, UnauthorizedException, NotFoundException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../entities/admin.entity';
import { Student } from '../entities/student.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    private jwtService: JwtService,
  ) {}

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.adminRepo.findOne({ where: { email: dto.email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, admin.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.signToken(admin.id, admin.email, Role.ADMIN);
    return { accessToken: token, role: Role.ADMIN };
  }

  async googleLogin(googleUser: { googleId: string; email: string; fullName: string }) {
    let student = await this.studentRepo.findOne({
      where: { googleId: googleUser.googleId },
    });

    if (!student) {
      student = this.studentRepo.create({
        googleId: googleUser.googleId,
        email: googleUser.email,
        fullName: googleUser.fullName,
        profileCompleted: false,
      });
      await this.studentRepo.save(student);
    }

    const token = this.signToken(student.id, student.email, Role.STUDENT);
    return {
      accessToken: token,
      role: Role.STUDENT,
      profileCompleted: student.profileCompleted,
    };
  }

  private signToken(sub: string, email: string, role: Role): string {
    return this.jwtService.sign({ sub, email, role });
  }

  /**
   * @deprecated Use initializeFirstAdmin instead
   */
  async seedAdmin(email: string, password: string) {
    const existing = await this.adminRepo.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== Role.ADMIN) {
        existing.role = Role.ADMIN;
        await this.adminRepo.save(existing);
      }
      return existing;
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = this.adminRepo.create({ email, password: hashed });
    return this.adminRepo.save(admin);
  }

  async initializeFirstAdmin(firstAdminEmail?: string, firstAdminPassword?: string) {
    if (!firstAdminEmail || !firstAdminPassword) {
      this.logger.warn(
        'FIRST_ADMIN_EMAIL and FIRST_ADMIN_PASSWORD not provided. ' +
        'Please set these environment variables to create/update the admin account.'
      );
      return;
    }

    let admin = await this.adminRepo.findOne({ where: { email: firstAdminEmail } });
    const hashed = await bcrypt.hash(firstAdminPassword, 10);
    
    if (admin) {
      admin.password = hashed;
      await this.adminRepo.save(admin);
      this.logger.log('Admin account password updated successfully');
    } else {
      admin = this.adminRepo.create({
        email: firstAdminEmail,
        password: hashed,
        role: Role.ADMIN,
      });
      await this.adminRepo.save(admin);
      this.logger.log('First admin account created successfully');
    }
  }
}
