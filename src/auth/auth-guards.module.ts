import { Module } from '@nestjs/common';
import { AccessGuard } from './guards/access.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  providers: [AccessGuard, JwtAuthGuard],
  exports: [AccessGuard, JwtAuthGuard],
})
export class AuthGuardsModule {}
