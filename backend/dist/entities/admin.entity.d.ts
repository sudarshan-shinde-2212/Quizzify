import { Role } from '../common/enums/role.enum';
export declare class Admin {
    id: string;
    email: string;
    password: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}
