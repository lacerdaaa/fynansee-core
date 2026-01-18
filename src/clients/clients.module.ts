import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ClientUser } from './entities/client-user.entity';
import { Client } from './entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientUser, User, Tenant])],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
