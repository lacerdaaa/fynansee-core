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
import { CreateClientDto } from './dto/create-client.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { ClientsService } from './clients.service';

@Controller('v1/tenants/:tenantId/clients')
@UseGuards(JwtAuthGuard, AccessGuard)
@UserTypes(UserType.Controller)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  create(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.createClient(tenantId, dto);
  }

  @Get()
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  findAll(@TenantId(new ParseUUIDPipe()) tenantId: string) {
    return this.clientsService.findAll(tenantId);
  }

  @Get(':clientId')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  findOne(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.clientsService.findOne(tenantId, clientId);
  }

  @Patch(':clientId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  update(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(tenantId, clientId, dto);
  }

  @Get(':clientId/users')
  @Roles(TenantRole.Owner, TenantRole.Admin, TenantRole.Analyst)
  listUsers(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.clientsService.listClientUsers(tenantId, clientId);
  }

  @Post(':clientId/users')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  addUser(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClientUserDto,
  ) {
    return this.clientsService.addClientUser(tenantId, clientId, dto);
  }

  @Patch(':clientId/users/:userId')
  @Roles(TenantRole.Owner, TenantRole.Admin)
  updateUser(
    @TenantId(new ParseUUIDPipe()) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateClientUserDto,
  ) {
    return this.clientsService.updateClientUser(
      tenantId,
      clientId,
      userId,
      dto,
    );
  }
}
