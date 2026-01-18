import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { TenantsService } from './tenants.service';

@Controller('v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.createTenant(dto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':tenantId')
  findOne(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch(':tenantId')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(tenantId, dto);
  }

  @Get(':tenantId/users')
  listUsers(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.listTenantUsers(tenantId);
  }

  @Post(':tenantId/users')
  addUser(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateTenantUserDto,
  ) {
    return this.tenantsService.addTenantUser(tenantId, dto);
  }

  @Patch(':tenantId/users/:userId')
  updateUser(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateTenantUserDto,
  ) {
    return this.tenantsService.updateTenantUser(tenantId, userId, dto);
  }
}
