import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserType, TenantRole } from '../common/enums/access.enum';
import { Roles } from './decorators/roles.decorator';
import { UserTypes } from './decorators/user-types.decorator';
import { AccessGuard } from './guards/access.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateClientInvitationDto } from './dto/create-client-invitation.dto';
import { CreateTenantInvitationDto } from './dto/create-tenant-invitation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { PasswordAuthDto } from './dto/password-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  signInWithGoogle(@Body() dto: GoogleAuthDto) {
    return this.authService.signInWithGoogle(dto);
  }

  @Post('login')
  signInWithPassword(@Body() dto: PasswordAuthDto) {
    return this.authService.signInWithPassword(dto);
  }

  @Post('password/forgot')
  requestPasswordReset(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password/reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('invitations/accept')
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(dto);
  }

  @UseGuards(JwtAuthGuard, AccessGuard)
  @UserTypes(UserType.Controller)
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @Post('invitations/tenant')
  createTenantInvitation(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateTenantInvitationDto,
  ) {
    return this.authService.createTenantInvitation(req.user, dto);
  }

  @UseGuards(JwtAuthGuard, AccessGuard)
  @UserTypes(UserType.Controller)
  @Roles(TenantRole.Owner, TenantRole.Admin)
  @Post('invitations/client')
  createClientInvitation(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateClientInvitationDto,
  ) {
    return this.authService.createClientInvitation(req.user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.getProfile(req.user);
  }
}
