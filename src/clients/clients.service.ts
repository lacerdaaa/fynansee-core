import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../common/utils/password.util';
import { UserType } from '../common/enums/access.enum';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { ClientUser } from './entities/client-user.entity';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(ClientUser)
    private readonly clientUsersRepository: Repository<ClientUser>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
  ) {}

  private async ensureTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  private async ensureClient(
    tenantId: string,
    clientId: string,
  ): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async createClient(tenantId: string, dto: CreateClientDto): Promise<Client> {
    await this.ensureTenant(tenantId);

    const client = this.clientsRepository.create({
      tenantId,
      name: dto.name,
      document: dto.document,
    });

    return this.clientsRepository.save(client);
  }

  async findAll(tenantId: string): Promise<Client[]> {
    await this.ensureTenant(tenantId);

    return this.clientsRepository.find({
      where: { tenantId },
    });
  }

  async findOne(tenantId: string, clientId: string): Promise<Client> {
    return this.ensureClient(tenantId, clientId);
  }

  async updateClient(
    tenantId: string,
    clientId: string,
    dto: UpdateClientDto,
  ): Promise<Client> {
    await this.ensureClient(tenantId, clientId);

    const client = await this.clientsRepository.preload({
      id: clientId,
      tenantId,
      ...dto,
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.clientsRepository.save(client);
  }

  async listClientUsers(
    tenantId: string,
    clientId: string,
  ): Promise<ClientUser[]> {
    await this.ensureClient(tenantId, clientId);

    return this.clientUsersRepository.find({
      where: { clientId },
      relations: ['user'],
    });
  }

  async addClientUser(
    tenantId: string,
    clientId: string,
    dto: CreateClientUserDto,
  ): Promise<ClientUser> {
    await this.ensureClient(tenantId, clientId);

    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    const passwordHash = dto.password
      ? await hashPassword(dto.password)
      : undefined;

    let user = existingUser;

    if (user) {
      if (user.type !== UserType.Client) {
        throw new BadRequestException('User type mismatch');
      }

      const existingMembership = await this.clientUsersRepository.findOne({
        where: { userId: user.id },
      });

      if (existingMembership?.clientId === clientId) {
        throw new BadRequestException('User already assigned to this client');
      }

      if (existingMembership && existingMembership.clientId !== clientId) {
        throw new BadRequestException('User already belongs to another client');
      }

      if (passwordHash) {
        await this.usersRepository.update(user.id, { passwordHash });
      }
    } else {
      user = this.usersRepository.create({
        name: dto.name,
        email: dto.email,
        type: UserType.Client,
        oauthProvider: passwordHash ? 'local' : 'google',
        passwordHash: passwordHash ?? null,
      });

      user = await this.usersRepository.save(user);
    }

    const membership = this.clientUsersRepository.create({
      clientId,
      userId: user.id,
      role: dto.role,
      isActive: dto.isActive ?? true,
    });

    return this.clientUsersRepository.save(membership);
  }

  async updateClientUser(
    tenantId: string,
    clientId: string,
    userId: string,
    dto: UpdateClientUserDto,
  ): Promise<ClientUser> {
    await this.ensureClient(tenantId, clientId);

    const membership = await this.clientUsersRepository.findOne({
      where: { clientId, userId },
    });

    if (!membership) {
      throw new NotFoundException('Client user not found');
    }

    Object.assign(membership, dto);

    return this.clientUsersRepository.save(membership);
  }
}
