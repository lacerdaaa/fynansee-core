import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { ClientsService } from './clients.service';

@Controller('v1/tenants/:tenantId/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.createClient(tenantId, dto);
  }

  @Get()
  findAll(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.clientsService.findAll(tenantId);
  }

  @Get(':clientId')
  findOne(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.clientsService.findOne(tenantId, clientId);
  }

  @Patch(':clientId')
  update(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(tenantId, clientId, dto);
  }

  @Get(':clientId/users')
  listUsers(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ) {
    return this.clientsService.listClientUsers(tenantId, clientId);
  }

  @Post(':clientId/users')
  addUser(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClientUserDto,
  ) {
    return this.clientsService.addClientUser(tenantId, clientId, dto);
  }

  @Patch(':clientId/users/:userId')
  updateUser(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
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
