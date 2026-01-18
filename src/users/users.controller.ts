import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { UserType, TenantRole } from '../common/enums/access.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserTypes } from '../auth/decorators/user-types.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessGuard } from '../auth/guards/access.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('v1/users')
@UseGuards(JwtAuthGuard, AccessGuard)
@UserTypes(UserType.Controller)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private requireTenantId(req: Request & { user: JwtPayload }) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant scope missing');
    }
    return tenantId;
  }

  @Get()
  @Roles(TenantRole.Owner, TenantRole.Admin)
  findAll(@Req() req: Request & { user: JwtPayload }) {
    return this.usersService.findAllForTenant(this.requireTenantId(req));
  }

  @Get(':userId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  findOne(
    @Req() req: Request & { user: JwtPayload },
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.findOneInTenant(
      userId,
      this.requireTenantId(req),
    );
  }

  @Patch(':userId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  update(
    @Req() req: Request & { user: JwtPayload },
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(
      userId,
      this.requireTenantId(req),
      dto,
    );
  }
}
