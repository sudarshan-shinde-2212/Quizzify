import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SettingsService } from '../../settings/settings.service';
import { Role } from '../enums/role.enum';

@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private settingsService: SettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is admin, allow access
    if (user?.role === Role.ADMIN) {
      return true;
    }

    // Check maintenance mode setting
    const settings = await this.settingsService.getSettings();
    if (settings.maintenanceMode) {
      throw new ForbiddenException('Platform is currently under maintenance. Please try again later.');
    }

    return true;
  }
}
