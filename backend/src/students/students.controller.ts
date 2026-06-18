import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('me')
  @Roles(Role.STUDENT, Role.ADMIN)
  getProfile(@CurrentUser() user: any) {
    if (user.role === Role.ADMIN) {
      return { id: 'admin', email: user.email, fullName: 'Administrator', role: Role.ADMIN };
    }
    return this.studentsService.findById(user.id);
  }

  @Get('admin/list')
  @Roles(Role.ADMIN)
  findAllStudents() {
    return this.studentsService.findAll();
  }

  @Post('profile')
  @Roles(Role.STUDENT)
  completeProfile(
    @CurrentUser() user: any,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.studentsService.completeProfile(user.id, dto);
  }
}
