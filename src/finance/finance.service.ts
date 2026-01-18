import {
  BadRequestException,
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
import { parse } from 'csv-parse/sync';
import { UserType } from '../common/enums/access.enum';
import { Client } from '../clients/entities/client.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { CreateClosingDto } from './dto/create-closing.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateProvisionDto } from './dto/create-provision.dto';
import { CreateReserveDto } from './dto/create-reserve.dto';
import { CreateStockDto } from './dto/create-stock.dto';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { ListImportRowsQueryDto } from './dto/list-import-rows-query.dto';
import { ListImportsQueryDto } from './dto/list-imports-query.dto';
import { ListClosingsQueryDto } from './dto/list-closings-query.dto';
import { ClosingHealthStatus } from './enums/closing-health.enum';
import { ClosingPeriodType } from './enums/closing-period.enum';
import { ImportBatchStatus, ImportRowStatus } from './enums/import-status.enum';
import { MovementType } from './enums/movement-type.enum';
import { ReserveType } from './enums/reserve-type.enum';
import { RecordSource } from './enums/record-source.enum';
import { Balance } from './entities/balance.entity';
import { Closing } from './entities/closing.entity';
import { Entry } from './entities/entry.entity';
import { ImportBatch } from './entities/import-batch.entity';
import { ImportRow } from './entities/import-row.entity';
import { Provision } from './entities/provision.entity';
import { Reserve } from './entities/reserve.entity';
import { Stock } from './entities/stock.entity';

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
    @InjectRepository(Closing)
    private readonly closingsRepository: Repository<Closing>,
    @InjectRepository(Reserve)
    private readonly reservesRepository: Repository<Reserve>,
    @InjectRepository(Stock)
    private readonly stocksRepository: Repository<Stock>,
    @InjectRepository(ImportBatch)
    private readonly importBatchesRepository: Repository<ImportBatch>,
    @InjectRepository(ImportRow)
    private readonly importRowsRepository: Repository<ImportRow>,
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

  private ensureCsvFile(file: Express.Multer.File) {
    const fileName = file.originalname?.toLowerCase();
    if (!fileName || !fileName.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are supported');
    }
  }

  private normalizeToDate(input: Date): string {
    return this.normalizeDate(input.toISOString());
  }

  private startOfDay(input: string): Date {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private endOfDay(input: string): Date {
    const date = new Date(input);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private getPeriodRange(
    periodType: ClosingPeriodType,
    reference: Date,
  ): { start: Date; end: Date } {
    const year = reference.getFullYear();
    const month = reference.getMonth();

    if (periodType === ClosingPeriodType.Quarterly) {
      const quarterStart = Math.floor(month / 3) * 3;
      const start = new Date(year, quarterStart, 1);
      const end = new Date(year, quarterStart + 3, 0);
      return { start, end };
    }

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
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

  async createStock(
    clientId: string,
    user: JwtPayload,
    dto: CreateStockDto,
  ): Promise<Stock> {
    await this.requireClientAccess(clientId, user);

    const recordedAt = dto.recordedAt
      ? new Date(dto.recordedAt)
      : new Date();

    const stock = this.stocksRepository.create({
      clientId,
      value: dto.value.toFixed(2),
      recordedAt,
      notes: dto.notes ?? null,
      createdByUserId: user.sub,
      source: RecordSource.Manual,
    });

    return this.stocksRepository.save(stock);
  }

  async listStocks(
    clientId: string,
    user: JwtPayload,
    query: DateRangeQueryDto,
  ): Promise<Stock[]> {
    await this.requireClientAccess(clientId, user);

    const where: Record<string, unknown> = { clientId };

    if (query.startDate && query.endDate) {
      where.recordedAt = Between(
        this.startOfDay(query.startDate),
        this.endOfDay(query.endDate),
      );
    } else if (query.startDate) {
      where.recordedAt = MoreThanOrEqual(this.startOfDay(query.startDate));
    } else if (query.endDate) {
      where.recordedAt = LessThanOrEqual(this.endOfDay(query.endDate));
    }

    return this.stocksRepository.find({
      where,
      order: { recordedAt: 'DESC' },
    });
  }

  async createReserve(
    clientId: string,
    user: JwtPayload,
    dto: CreateReserveDto,
  ): Promise<Reserve> {
    await this.requireClientAccess(clientId, user);

    const recordedAt = dto.recordedAt
      ? new Date(dto.recordedAt)
      : new Date();

    const reserve = this.reservesRepository.create({
      clientId,
      type: dto.type,
      value: dto.value.toFixed(2),
      recordedAt,
      label: dto.label ?? null,
      notes: dto.notes ?? null,
      createdByUserId: user.sub,
      source: RecordSource.Manual,
    });

    return this.reservesRepository.save(reserve);
  }

  async listReserves(
    clientId: string,
    user: JwtPayload,
    query: DateRangeQueryDto,
  ): Promise<Reserve[]> {
    await this.requireClientAccess(clientId, user);

    const where: Record<string, unknown> = { clientId };

    if (query.startDate && query.endDate) {
      where.recordedAt = Between(
        this.startOfDay(query.startDate),
        this.endOfDay(query.endDate),
      );
    } else if (query.startDate) {
      where.recordedAt = MoreThanOrEqual(this.startOfDay(query.startDate));
    } else if (query.endDate) {
      where.recordedAt = LessThanOrEqual(this.endOfDay(query.endDate));
    }

    return this.reservesRepository.find({
      where,
      order: { recordedAt: 'DESC' },
    });
  }

  async getIndicators(clientId: string, user: JwtPayload) {
    await this.requireClientAccess(clientId, user);

    const [latestStock, latestReserve, latestInvestment] = await Promise.all([
      this.stocksRepository.findOne({
        where: { clientId },
        order: { recordedAt: 'DESC' },
      }),
      this.reservesRepository.findOne({
        where: { clientId, type: ReserveType.Reserve },
        order: { recordedAt: 'DESC' },
      }),
      this.reservesRepository.findOne({
        where: { clientId, type: ReserveType.Investment },
        order: { recordedAt: 'DESC' },
      }),
    ]);

    const stockValue = latestStock ? this.parseAmount(latestStock.value) : 0;
    const reserveValue = latestReserve
      ? this.parseAmount(latestReserve.value)
      : 0;
    const investmentValue = latestInvestment
      ? this.parseAmount(latestInvestment.value)
      : 0;
    const reservesTotal = reserveValue + investmentValue;

    return {
      clientId,
      stock: {
        value: stockValue,
        recordedAt: latestStock?.recordedAt ?? null,
      },
      reserves: {
        reserve: {
          value: reserveValue,
          recordedAt: latestReserve?.recordedAt ?? null,
        },
        investment: {
          value: investmentValue,
          recordedAt: latestInvestment?.recordedAt ?? null,
        },
        total: reservesTotal,
      },
      totalAssets: stockValue + reservesTotal,
    };
  }

  async createCsvImport(
    clientId: string,
    user: JwtPayload,
    file: Express.Multer.File,
  ) {
    await this.requireClientAccess(clientId, user);

    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    this.ensureCsvFile(file);

    const maxRows = Number(process.env.IMPORT_MAX_ROWS ?? 5000);
    const records = parse(file.buffer, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new BadRequestException('CSV has no data rows');
    }

    if (records.length > maxRows) {
      throw new BadRequestException('CSV exceeds row limit');
    }

    const headers = Object.keys(records[0] ?? {});

    const batch = this.importBatchesRepository.create({
      clientId,
      fileName: file.originalname,
      headers,
      rowCount: records.length,
      errorCount: 0,
      status: ImportBatchStatus.Uploaded,
      createdByUserId: user.sub,
    });

    const savedBatch = await this.importBatchesRepository.save(batch);

    const rows = records.map((record, index) => ({
      batchId: savedBatch.id,
      rowIndex: index + 1,
      data: record,
      status: ImportRowStatus.Pending,
      errors: [],
    }));

    if (rows.length > 0) {
      await this.importRowsRepository.insert(rows);
    }

    return {
      batchId: savedBatch.id,
      rowCount: savedBatch.rowCount,
      headers: savedBatch.headers,
      status: savedBatch.status,
    };
  }

  async listImports(
    clientId: string,
    user: JwtPayload,
    query: ListImportsQueryDto,
  ) {
    await this.requireClientAccess(clientId, user);

    const where: Record<string, unknown> = { clientId };

    if (query.status) {
      where.status = query.status;
    }

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const [items, total] = await this.importBatchesRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { total, items };
  }

  private async getImportBatch(
    clientId: string,
    batchId: string,
  ): Promise<ImportBatch> {
    const batch = await this.importBatchesRepository.findOne({
      where: { id: batchId, clientId },
    });

    if (!batch) {
      throw new NotFoundException('Import batch not found');
    }

    return batch;
  }

  async getImportDetails(
    clientId: string,
    user: JwtPayload,
    batchId: string,
  ) {
    await this.requireClientAccess(clientId, user);

    const batch = await this.getImportBatch(clientId, batchId);

    const sampleRows = await this.importRowsRepository.find({
      where: { batchId },
      order: { rowIndex: 'ASC' },
      take: 10,
    });

    return { batch, sampleRows };
  }

  async listImportRows(
    clientId: string,
    user: JwtPayload,
    batchId: string,
    query: ListImportRowsQueryDto,
  ) {
    await this.requireClientAccess(clientId, user);
    await this.getImportBatch(clientId, batchId);

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    const [items, total] = await this.importRowsRepository.findAndCount({
      where: { batchId },
      order: { rowIndex: 'ASC' },
      take: limit,
      skip: offset,
    });

    return { total, items };
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

  async createClosing(
    clientId: string,
    user: JwtPayload,
    dto: CreateClosingDto,
  ): Promise<Closing> {
    await this.requireClientAccess(clientId, user);

    const referenceDate = dto.referenceDate
      ? new Date(dto.referenceDate)
      : new Date();
    const { start, end } = this.getPeriodRange(dto.periodType, referenceDate);
    const periodStart = this.normalizeToDate(start);
    const periodEnd = this.normalizeToDate(end);

    const [entries, provisions] = await Promise.all([
      this.entriesRepository.find({
        where: {
          clientId,
          occurredOn: Between(periodStart, periodEnd),
        },
      }),
      this.provisionsRepository.find({
        where: {
          clientId,
          dueOn: Between(periodStart, periodEnd),
        },
      }),
    ]);

    const startingBalanceRecord = await this.balancesRepository.findOne({
      where: { clientId, recordedAt: LessThanOrEqual(start) },
      order: { recordedAt: 'DESC' },
    });
    const startingBalance = startingBalanceRecord
      ? this.parseAmount(startingBalanceRecord.amount)
      : 0;

    const dailyMovements = new Map<string, number>();
    const dailyIncome = new Map<string, number>();
    let incomeTotal = 0;
    let expenseTotal = 0;

    for (const entry of entries) {
      const amount = this.parseAmount(entry.amount);
      if (entry.type === MovementType.Income) {
        incomeTotal += amount;
        dailyIncome.set(
          entry.occurredOn,
          (dailyIncome.get(entry.occurredOn) ?? 0) + amount,
        );
      } else {
        expenseTotal += amount;
      }

      dailyMovements.set(
        entry.occurredOn,
        (dailyMovements.get(entry.occurredOn) ?? 0) +
          this.applyMovement(entry.type, amount),
      );
    }

    for (const provision of provisions) {
      const amount = this.parseAmount(provision.amount);
      if (provision.type === MovementType.Income) {
        incomeTotal += amount;
        dailyIncome.set(
          provision.dueOn,
          (dailyIncome.get(provision.dueOn) ?? 0) + amount,
        );
      } else {
        expenseTotal += amount;
      }

      dailyMovements.set(
        provision.dueOn,
        (dailyMovements.get(provision.dueOn) ?? 0) +
          this.applyMovement(provision.type, amount),
      );
    }

    const lowIncomeDays: string[] = [];
    let runningBalance = startingBalance;
    let dayOfCashShort: string | null = null;

    for (
      let cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const dateKey = this.normalizeToDate(cursor);
      const net = dailyMovements.get(dateKey) ?? 0;
      runningBalance += net;

      const income = dailyIncome.get(dateKey) ?? 0;
      if (income <= 0) {
        lowIncomeDays.push(dateKey);
      }

      if (!dayOfCashShort && runningBalance < 0) {
        dayOfCashShort = dateKey;
      }
    }

    const netTotal = incomeTotal - expenseTotal;
    const endingBalance = startingBalance + netTotal;

    const healthStatus = dayOfCashShort
      ? ClosingHealthStatus.Critical
      : netTotal < 0
        ? ClosingHealthStatus.Warning
        : ClosingHealthStatus.Healthy;

    const existing = await this.closingsRepository.findOne({
      where: { clientId, periodType: dto.periodType, periodStart, periodEnd },
    });

    const closing = this.closingsRepository.create({
      id: existing?.id,
      clientId,
      periodType: dto.periodType,
      periodStart,
      periodEnd,
      incomeTotal: incomeTotal.toFixed(2),
      expenseTotal: expenseTotal.toFixed(2),
      netTotal: netTotal.toFixed(2),
      startingBalance: startingBalance.toFixed(2),
      endingBalance: endingBalance.toFixed(2),
      dayOfCashShort,
      lowIncomeDays,
      lowIncomeDaysCount: lowIncomeDays.length,
      healthStatus,
      generatedAt: new Date(),
      createdByUserId: user.sub,
    });

    return this.closingsRepository.save(closing);
  }

  async listClosings(
    clientId: string,
    user: JwtPayload,
    query: ListClosingsQueryDto,
  ): Promise<Closing[]> {
    await this.requireClientAccess(clientId, user);

    const where: Record<string, unknown> = { clientId };

    if (query.periodType) {
      where.periodType = query.periodType;
    }

    if (query.startDate && query.endDate) {
      where.periodStart = Between(
        this.normalizeDate(query.startDate),
        this.normalizeDate(query.endDate),
      );
    } else if (query.startDate) {
      where.periodStart = MoreThanOrEqual(this.normalizeDate(query.startDate));
    } else if (query.endDate) {
      where.periodStart = LessThanOrEqual(this.normalizeDate(query.endDate));
    }

    return this.closingsRepository.find({
      where,
      order: { periodStart: 'DESC' },
    });
  }
}
