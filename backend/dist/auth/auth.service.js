"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const admin_entity_1 = require("../entities/admin.entity");
const student_entity_1 = require("../entities/student.entity");
const role_enum_1 = require("../common/enums/role.enum");
let AuthService = class AuthService {
    constructor(adminRepo, studentRepo, jwtService) {
        this.adminRepo = adminRepo;
        this.studentRepo = studentRepo;
        this.jwtService = jwtService;
    }
    async adminLogin(dto) {
        const admin = await this.adminRepo.findOne({ where: { email: dto.email } });
        if (!admin)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(dto.password, admin.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const token = this.signToken(admin.id, admin.email, role_enum_1.Role.ADMIN);
        return { accessToken: token, role: role_enum_1.Role.ADMIN };
    }
    async googleLogin(googleUser) {
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
        const token = this.signToken(student.id, student.email, role_enum_1.Role.STUDENT);
        return {
            accessToken: token,
            role: role_enum_1.Role.STUDENT,
            profileCompleted: student.profileCompleted,
        };
    }
    signToken(sub, email, role) {
        return this.jwtService.sign({ sub, email, role });
    }
    async seedAdmin(email, password) {
        const existing = await this.adminRepo.findOne({ where: { email } });
        if (existing)
            return existing;
        const hashed = await bcrypt.hash(password, 10);
        const admin = this.adminRepo.create({ email, password: hashed });
        return this.adminRepo.save(admin);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map