import { Response } from 'express';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    adminLogin(dto: AdminLoginDto): Promise<{
        accessToken: string;
        role: import("../common/enums/role.enum").Role;
    }>;
    googleAuth(): void;
    googleCallback(req: any, res: Response): Promise<any>;
}
