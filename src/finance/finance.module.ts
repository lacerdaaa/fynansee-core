import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthGuardsModule } from '../auth/auth-guards.module';
import { Client } from '../clients/entities/client.entity';
import { Balance } from './entities/balance.entity';
import { Closing } from './entities/closing.entity';
import { Entry } from './entities/entry.entity';
import { Provision } from './entities/provision.entity';
import { Reserve } from './entities/reserve.entity';
import { Stock } from './entities/stock.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Entry,
      Provision,
      Balance,
      Closing,
      Reserve,
      Stock,
      Client,
    ]),
    AuthGuardsModule,
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
