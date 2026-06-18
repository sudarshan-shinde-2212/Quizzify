import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}

  async completeProfile(studentId: string, dto: CompleteProfileDto) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    Object.assign(student, { ...dto, profileCompleted: true });
    return this.studentRepo.save(student);
  }

  async findById(id: string) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findAll() {
    return this.studentRepo.find({ order: { createdAt: 'DESC' } });
  }
}
