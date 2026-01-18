import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAllForTenant(tenantId: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(
        'user.tenantMemberships',
        'tenantMembership',
        'tenantMembership.tenantId = :tenantId AND tenantMembership.isActive = true',
        { tenantId },
      )
      .getMany();
  }

  async findOneInTenant(userId: string, tenantId: string): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin(
        'user.tenantMemberships',
        'tenantMembership',
        'tenantMembership.tenantId = :tenantId AND tenantMembership.isActive = true',
        { tenantId },
      )
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    userId: string,
    tenantId: string,
    dto: UpdateUserDto,
  ): Promise<User> {
    await this.findOneInTenant(userId, tenantId);

    const user = await this.usersRepository.preload({
      id: userId,
      ...dto,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.usersRepository.save(user);
  }
}
