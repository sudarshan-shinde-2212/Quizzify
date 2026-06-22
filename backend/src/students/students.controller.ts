import { Controller, Post, Get, Body, UseGuards, Query, Param } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MaintenanceModeGuard } from '../common/guards/maintenance-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, MaintenanceModeGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('students/me')
  @Roles(Role.STUDENT, Role.ADMIN)
  getProfile(@CurrentUser() user: any) {
    if (user.role === Role.ADMIN) {
      return { id: 'admin', email: user.email, fullName: 'Administrator', role: Role.ADMIN };
    }
    return this.studentsService.findById(user.id);
  }

  @Get('admin/users')
  @Roles(Role.ADMIN)
  findAllStudents() {
    return this.studentsService.findAll();
  }

  @Get('admin/users/search')
  @Roles(Role.ADMIN)
  searchStudents(@Query('q') query: string) {
    return this.studentsService.search(query);
  }

  @Get('admin/users/:id')
  @Roles(Role.ADMIN)
  getUserDetails(@Param('id') id: string) {
    return this.studentsService.getUserDetails(id);
  }

  @Get('admin/users/:id/history')
  @Roles(Role.ADMIN)
  getUserHistory(
    @Param('id') id: string,
    @Query('q') search?: string,
    @Query('sortBy') sortBy?: 'date' | 'score',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.studentsService.getUserHistory(id, search, sortBy, sortOrder);
  }

  @Post('students/profile')
  @Roles(Role.STUDENT)
  completeProfile(
    @CurrentUser() user: any,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.studentsService.completeProfile(user.id, dto);
  }
}
