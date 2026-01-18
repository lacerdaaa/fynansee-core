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
import { RecordSource } from './enums/record-source.enum';
import { Balance } from './entities/balance.entity';
import { Entry } from './entities/entry.entity';
import { Provision } from './entities/provision.entity';

type DailyCashflowItem = {
  date: string;
  net: number;
  balance: number;
};

type MonthlyCashflowItem = {
  month: string;
  income: number;
  expense: number;
  net: number;
  endingBalance: number;
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
      createdByUserId: user.sub,
      source: RecordSource.Manual,
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
      createdByUserId: user.sub,
      source: RecordSource.Manual,
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
      createdByUserId: user.sub,
      source: RecordSource.Manual,
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

    const startingBalance = latestBalance
      ? this.parseAmount(latestBalance.amount)
      : 0;
    let runningBalance = startingBalance;

    const dailyMovements = new Map<string, number>();
    const dailyIncome = new Map<string, number>();
    const dailyExpense = new Map<string, number>();

    for (const entry of entries) {
      const parsedAmount = this.parseAmount(entry.amount);
      const amount = this.applyMovement(entry.type, parsedAmount);
      dailyMovements.set(
        entry.occurredOn,
        (dailyMovements.get(entry.occurredOn) ?? 0) + amount,
      );

      if (entry.type === MovementType.Income) {
        dailyIncome.set(
          entry.occurredOn,
          (dailyIncome.get(entry.occurredOn) ?? 0) + parsedAmount,
        );
      } else {
        dailyExpense.set(
          entry.occurredOn,
          (dailyExpense.get(entry.occurredOn) ?? 0) + parsedAmount,
        );
      }
    }

    for (const provision of provisions) {
      const parsedAmount = this.parseAmount(provision.amount);
      const amount = this.applyMovement(provision.type, parsedAmount);
      dailyMovements.set(
        provision.dueOn,
        (dailyMovements.get(provision.dueOn) ?? 0) + amount,
      );

      if (provision.type === MovementType.Income) {
        dailyIncome.set(
          provision.dueOn,
          (dailyIncome.get(provision.dueOn) ?? 0) + parsedAmount,
        );
      } else {
        dailyExpense.set(
          provision.dueOn,
          (dailyExpense.get(provision.dueOn) ?? 0) + parsedAmount,
        );
      }
    }

    const days: DailyCashflowItem[] = [];
    const monthsMap = new Map<string, MonthlyCashflowItem>();
    let dayOfCashShort: string | null = null;

    let runwayBalance = startingBalance;
    let runwayDays: number | null = null;
    let runwayEndsOn: string | null = null;

    if (runwayBalance < 0) {
      runwayDays = 0;
      runwayEndsOn = startKey;
    }

    let dayIndex = 0;

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

      const monthKey = dateKey.slice(0, 7);
      const income = dailyIncome.get(dateKey) ?? 0;
      const expense = dailyExpense.get(dateKey) ?? 0;
      const monthEntry =
        monthsMap.get(monthKey) ?? {
          month: monthKey,
          income: 0,
          expense: 0,
          net: 0,
          endingBalance: runningBalance,
        };

      monthEntry.income += income;
      monthEntry.expense += expense;
      monthEntry.net += net;
      monthEntry.endingBalance = runningBalance;
      monthsMap.set(monthKey, monthEntry);

      if (runwayDays === null) {
        runwayBalance -= expense;
        dayIndex += 1;
        if (runwayBalance < 0) {
          runwayDays = dayIndex;
          runwayEndsOn = dateKey;
        }
      }

      days.push({
        date: dateKey,
        net,
        balance: runningBalance,
      });
    }

    const monthly = Array.from(monthsMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const runwayMonths =
      runwayDays !== null ? Number((runwayDays / 30).toFixed(2)) : null;

    return {
      clientId,
      startDate: startKey,
      endDate: endKey,
      startingBalance,
      endingBalance: runningBalance,
      dayOfCashShort,
      runway: {
        days: runwayDays,
        months: runwayMonths,
        endsOn: runwayEndsOn,
      },
      days,
      months: monthly,
    };
  }
}
