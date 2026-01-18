import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ClientRole, TenantRole, UserType } from '../common/enums/access.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserTypes } from '../auth/decorators/user-types.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessGuard } from '../auth/guards/access.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CashflowQueryDto } from './dto/cashflow-query.dto';
import { CreateBalanceDto } from './dto/create-balance.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateProvisionDto } from './dto/create-provision.dto';
import { DateRangeQueryDto } from './dto/date-range-query.dto';
import { FinanceService } from './finance.service';

@Controller('v1/clients/:clientId')
@UseGuards(JwtAuthGuard, AccessGuard)
@UserTypes(UserType.Controller, UserType.Client)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('entries')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
  )
  createEntry(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateEntryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createEntry(clientId, req.user, dto);
  }

  @Get('entries')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listEntries(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: DateRangeQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listEntries(clientId, req.user, query);
  }

  @Post('provisions')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
  )
  createProvision(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateProvisionDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createProvision(clientId, req.user, dto);
  }

  @Get('provisions')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listProvisions(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: DateRangeQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listProvisions(clientId, req.user, query);
  }

  @Post('balances')
  @Roles(TenantRole.Owner, TenantRole.Admin, ClientRole.Admin)
  createBalance(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateBalanceDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createBalance(clientId, req.user, dto);
  }

  @Get('balances')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listBalances(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listBalances(clientId, req.user);
  }

  @Get('cashflow')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  getCashflow(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: CashflowQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.getCashflow(
      clientId,
      req.user,
      query.months ?? 6,
    );
  }
}
