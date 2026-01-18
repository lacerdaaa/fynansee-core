import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ClientRole, TenantRole, UserType } from '../common/enums/access.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserTypes } from '../auth/decorators/user-types.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessGuard } from '../auth/guards/access.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CashflowQueryDto } from './dto/cashflow-query.dto';
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
import { FinanceService } from './finance.service';

const MAX_IMPORT_FILE_SIZE = Number(
  process.env.IMPORT_MAX_FILE_SIZE ?? 50_000_000,
);

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

  @Post('stocks')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
  )
  createStock(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateStockDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createStock(clientId, req.user, dto);
  }

  @Get('stocks')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listStocks(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: DateRangeQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listStocks(clientId, req.user, query);
  }

  @Post('reserves')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
  )
  createReserve(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateReserveDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createReserve(clientId, req.user, dto);
  }

  @Get('reserves')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listReserves(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: DateRangeQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listReserves(clientId, req.user, query);
  }

  @Get('indicators')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  getIndicators(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.getIndicators(clientId, req.user);
  }

  @Post('imports/csv')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMPORT_FILE_SIZE } }),
  )
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
  )
  createCsvImport(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMPORT_FILE_SIZE }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createCsvImport(clientId, req.user, file);
  }

  @Get('imports')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listImports(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: ListImportsQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listImports(clientId, req.user, query);
  }

  @Get('imports/:batchId')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  getImportDetails(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.getImportDetails(clientId, req.user, batchId);
  }

  @Get('imports/:batchId/rows')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listImportRows(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('batchId', ParseUUIDPipe) batchId: string,
    @Query() query: ListImportRowsQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listImportRows(
      clientId,
      req.user,
      batchId,
      query,
    );
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

  @Post('closings')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
  )
  createClosing(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: CreateClosingDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.createClosing(clientId, req.user, dto);
  }

  @Get('closings')
  @Roles(
    TenantRole.Owner,
    TenantRole.Admin,
    TenantRole.Analyst,
    ClientRole.Admin,
    ClientRole.Viewer,
  )
  listClosings(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: ListClosingsQueryDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.financeService.listClosings(clientId, req.user, query);
  }
}
