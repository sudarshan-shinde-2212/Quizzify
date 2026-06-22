import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GlobalSearchService } from './global-search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('admin/search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class GlobalSearchController {
  constructor(private globalSearchService: GlobalSearchService) {}

  @Get()
  search(@Query('q') query: string) {
    return this.globalSearchService.search(query);
  }
}
