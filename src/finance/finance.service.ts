import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { UserType } from '../common/enums/access.enum';
import { Client } from '../clients/entities/client.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateProvisionDto } from './dto/create-provision.dto';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { MovementType } from './enums/movement-type.enum';
import { Balance } from './entities/balance.entity';
import { Entry } from './entities/entry.entity';
import { Provision } from './entities/provision.entity';

type DailyCashflowItem = {
  date: string;
  net: number;
  balance: number;
};

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Entry)
    private readonly entriesRepository: Repository<Entry>,
    @InjectRepository(Provision)
    private readonly provisionsRepository: Repository<Provision>,
    @InjectRepository(Balance)
    private readonly balancesRepository: Repository<Balance>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  private async requireClientAccess(
    clientId: string,
    user: JwtPayload,
  ): Promise<Client> {
    const client = await this.clientsRepository.findOne({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (user.type === UserType.Controller) {
      if (!user.tenantId) {
        throw new ForbiddenException('Tenant scope missing');
      }
      if (client.tenantId !== user.tenantId) {
        throw new ForbiddenException('Client not in tenant scope');
      }
    } else if (user.clientId !== clientId) {
      throw new ForbiddenException('Client scope mismatch');
    }

    return client;
  }

  private normalizeDate(input: string): string {
    return input.slice(0, 10);
  }

  private parseAmount(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    return Number.parseFloat(value);
  }

  private applyMovement(type: MovementType, amount: number): number {
    return type === MovementType.Income ? amount : -amount;
  }

  async createEntry(
    clientId: string,
    user: JwtPayload,
    dto: CreateEntryDto,
  ): Promise<Entry> {
    await this.requireClientAccess(clientId, user);

    const entry = this.entriesRepository.create({
      clientId,
      type: dto.type,
      amount: dto.amount.toFixed(2),
      occurredOn: this.normalizeDate(dto.occurredOn),
      description: dto.description,
      notes: dto.notes ?? null,
    });

    return this.entriesRepository.save(entry);
  }

  async listEntries(
    clientId: string,
    user: JwtPayload,
    query: DateRangeQueryDto,
  ): Promise<Entry[]> {
    await this.requireClientAccess(clientId, user);

    const where: Record<string, unknown> = { clientId };

    if (query.startDate && query.endDate) {
      where.occurredOn = Between(
        this.normalizeDate(query.startDate),
        this.normalizeDate(query.endDate),
      );
    } else if (query.startDate) {
      where.occurredOn = MoreThanOrEqual(
        this.normalizeDate(query.startDate),
      );
    } else if (query.endDate) {
      where.occurredOn = LessThanOrEqual(this.normalizeDate(query.endDate));
    }

    return this.entriesRepository.find({
      where,
      order: { occurredOn: 'ASC' },
    });
  }

  async createProvision(
    clientId: string,
    user: JwtPayload,
    dto: CreateProvisionDto,
  ): Promise<Provision> {
    await this.requireClientAccess(clientId, user);

    const provision = this.provisionsRepository.create({
      clientId,
      type: dto.type,
      amount: dto.amount.toFixed(2),
      dueOn: this.normalizeDate(dto.dueOn),
      description: dto.description,
      notes: dto.notes ?? null,
    });

    return this.provisionsRepository.save(provision);
  }

  async listProvisions(
    clientId: string,
    user: JwtPayload,
    query: DateRangeQueryDto,
  ): Promise<Provision[]> {
    await this.requireClientAccess(clientId, user);

    const where: Record<string, unknown> = { clientId };

    if (query.startDate && query.endDate) {
      where.dueOn = Between(
        this.normalizeDate(query.startDate),
        this.normalizeDate(query.endDate),
      );
    } else if (query.startDate) {
      where.dueOn = MoreThanOrEqual(this.normalizeDate(query.startDate));
    } else if (query.endDate) {
      where.dueOn = LessThanOrEqual(this.normalizeDate(query.endDate));
    }

    return this.provisionsRepository.find({
      where,
      order: { dueOn: 'ASC' },
    });
  }

  async createBalance(
    clientId: string,
    user: JwtPayload,
    dto: CreateBalanceDto,
  ): Promise<Balance> {
    await this.requireClientAccess(clientId, user);

    const recordedAt = dto.recordedAt
      ? new Date(dto.recordedAt)
      : new Date();

    const balance = this.balancesRepository.create({
      clientId,
      amount: dto.amount.toFixed(2),
      recordedAt,
    });

    return this.balancesRepository.save(balance);
  }

  async listBalances(
    clientId: string,
    user: JwtPayload,
  ): Promise<Balance[]> {
    await this.requireClientAccess(clientId, user);

    return this.balancesRepository.find({
      where: { clientId },
      order: { recordedAt: 'DESC' },
    });
  }

  async getCashflow(
    clientId: string,
    user: JwtPayload,
    months = 6,
  ) {
    await this.requireClientAccess(clientId, user);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    endDate.setDate(endDate.getDate() - 1);

    const startKey = this.normalizeDate(startDate.toISOString());
    const endKey = this.normalizeDate(endDate.toISOString());

    const [entries, provisions] = await Promise.all([
      this.entriesRepository.find({
        where: {
          clientId,
          occurredOn: Between(startKey, endKey),
        },
      }),
      this.provisionsRepository.find({
        where: {
          clientId,
          dueOn: Between(startKey, endKey),
        },
      }),
    ]);

    const latestBalance = await this.balancesRepository.findOne({
      where: { clientId, recordedAt: LessThanOrEqual(endDate) },
      order: { recordedAt: 'DESC' },
    });

    let runningBalance = latestBalance
      ? this.parseAmount(latestBalance.amount)
      : 0;

    const dailyMovements = new Map<string, number>();

    for (const entry of entries) {
      const amount = this.applyMovement(
        entry.type,
        this.parseAmount(entry.amount),
      );
      dailyMovements.set(
        entry.occurredOn,
        (dailyMovements.get(entry.occurredOn) ?? 0) + amount,
      );
    }

    for (const provision of provisions) {
      const amount = this.applyMovement(
        provision.type,
        this.parseAmount(provision.amount),
      );
      dailyMovements.set(
        provision.dueOn,
        (dailyMovements.get(provision.dueOn) ?? 0) + amount,
      );
    }

    const days: DailyCashflowItem[] = [];
    let dayOfCashShort: string | null = null;

    for (
      let cursor = new Date(startDate);
      cursor <= endDate;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const dateKey = this.normalizeDate(cursor.toISOString());
      const net = dailyMovements.get(dateKey) ?? 0;
      runningBalance += net;

      if (!dayOfCashShort && runningBalance < 0) {
        dayOfCashShort = dateKey;
      }

      days.push({
        date: dateKey,
        net,
        balance: runningBalance,
      });
    }

    return {
      clientId,
      startDate: startKey,
      endDate: endKey,
      startingBalance: latestBalance
        ? this.parseAmount(latestBalance.amount)
        : 0,
      endingBalance: runningBalance,
      dayOfCashShort,
      days,
    };
  }
}
