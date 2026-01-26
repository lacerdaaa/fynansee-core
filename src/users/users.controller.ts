import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserType, TenantRole } from '../common/enums/access.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserTypes } from '../auth/decorators/user-types.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessGuard } from '../auth/guards/access.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(JwtAuthGuard, AccessGuard)
@UserTypes(UserType.Controller)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(TenantRole.Owner, TenantRole.Admin)
  findAll(@TenantId(new ParseUUIDPipe()) tenantId: string) {
    return this.usersService.findAllForTenant(tenantId);
  }

  @Get(':userId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  findOne(
    @Param('userId', ParseUUIDPipe) userId: string,
    @TenantId(new ParseUUIDPipe()) tenantId: string,
  ) {
    return this.usersService.findOneInTenant(userId, tenantId);
  }

  @Patch(':userId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
    @TenantId(new ParseUUIDPipe()) tenantId: string,
  ) {
    return this.usersService.updateUser(userId, tenantId, dto);
  }
}
