import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { Admin } from '../../entities/admin.entity';
import { Student } from '../../entities/student.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.role === Role.ADMIN) {
      const admin = await this.adminRepo.findOne({
        where: { id: payload.sub },
      });

      if (!admin) {
        throw new UnauthorizedException();
      }

      return {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      };
    }

    const student = await this.studentRepo.findOne({
      where: { id: payload.sub },
    });

    if (!student) {
      throw new UnauthorizedException();
    }

    return {
      id: student.id,
      email: student.email,
      role: student.role,
    };
  }
}
