import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { User } from '../users/entities/user.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { Tenant } from './entities/tenant.entity';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, TenantUser, User]), AuthGuardsModule],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
