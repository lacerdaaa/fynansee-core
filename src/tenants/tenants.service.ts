import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../common/utils/password.util';
import { UserType } from '../common/enums/access.enum';
import { User } from '../users/entities/user.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';
import { TenantUser } from './entities/tenant-user.entity';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUsersRepository: Repository<TenantUser>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createTenant(dto: CreateTenantDto): Promise<Tenant> {
    const tenant = this.tenantsRepository.create({
      name: dto.name,
    });

    return this.tenantsRepository.save(tenant);
  }

  findAllForTenant(tenantId?: string): Promise<Tenant[]> {
    if (!tenantId) {
      return this.tenantsRepository.find();
    }

    return this.tenantsRepository.find({ where: { id: tenantId } });
  }

  async findOne(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(
    tenantId: string,
    dto: UpdateTenantDto,
  ): Promise<Tenant> {
    const tenant = await this.tenantsRepository.preload({
      id: tenantId,
      ...dto,
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.tenantsRepository.save(tenant);
  }

  async listTenantUsers(tenantId: string): Promise<TenantUser[]> {
    await this.findOne(tenantId);

    return this.tenantUsersRepository.find({
      where: { tenantId },
      relations: ['user'],
    });
  }

  async addTenantUser(
    tenantId: string,
    dto: CreateTenantUserDto,
  ): Promise<TenantUser> {
    await this.findOne(tenantId);

    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    const passwordHash = dto.password
      ? await hashPassword(dto.password)
      : undefined;

    let user = existingUser;

    if (user) {
      if (user.type !== UserType.Controller) {
        throw new BadRequestException('User type mismatch');
      }

      const existingMembership = await this.tenantUsersRepository.findOne({
        where: { userId: user.id },
      });

      if (existingMembership?.tenantId === tenantId) {
        throw new BadRequestException('User already assigned to this tenant');
      }

      if (existingMembership && existingMembership.tenantId !== tenantId) {
        throw new BadRequestException('User already belongs to another tenant');
      }

      if (passwordHash) {
        await this.usersRepository.update(user.id, { passwordHash });
      }
    } else {
      user = this.usersRepository.create({
        name: dto.name,
        email: dto.email,
        type: UserType.Controller,
        oauthProvider: passwordHash ? 'local' : 'google',
        passwordHash: passwordHash ?? null,
      });

      user = await this.usersRepository.save(user);
    }

    const membership = this.tenantUsersRepository.create({
      tenantId,
      userId: user.id,
      role: dto.role,
      isActive: dto.isActive ?? true,
    });

    return this.tenantUsersRepository.save(membership);
  }

  async updateTenantUser(
    tenantId: string,
    userId: string,
    dto: UpdateTenantUserDto,
  ): Promise<TenantUser> {
    await this.findOne(tenantId);

    const membership = await this.tenantUsersRepository.findOne({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new NotFoundException('Tenant user not found');
    }

    Object.assign(membership, dto);

    return this.tenantUsersRepository.save(membership);
  }
}
