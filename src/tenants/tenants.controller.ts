import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserType, TenantRole } from '../common/enums/access.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserTypes } from '../auth/decorators/user-types.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessGuard } from '../auth/guards/access.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { TenantsService } from './tenants.service';

@Controller('v1/tenants')
@UseGuards(JwtAuthGuard, AccessGuard)
@UserTypes(UserType.Controller)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Get()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  findAll(@TenantId() tenantId?: string) {
    return this.tenantsService.findAllForTenant(tenantId);
  }

  @Get(':tenantId')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  findOne(@TenantId(new ParseUUIDPipe()) tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch(':tenantId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  update(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(tenantId, dto);
  }

  @Get(':tenantId/users')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  listUsers(@TenantId(new ParseUUIDPipe()) tenantId: string) {
    return this.tenantsService.listTenantUsers(tenantId);
  }

  @Post(':tenantId/users')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  addUser(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Body() dto: CreateTenantUserDto,
  ) {
    return this.tenantsService.addTenantUser(tenantId, dto);
  }

  @Patch(':tenantId/users/:userId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  updateUser(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateTenantUserDto,
  ) {
    return this.tenantsService.updateTenantUser(tenantId, userId, dto);
  }
}
