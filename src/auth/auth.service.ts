import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { ClientRole, TenantRole, UserType } from '../common/enums/access.enum';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import { generateTokenPair, hashToken } from '../common/utils/token.util';
import { ClientUser } from '../clients/entities/client-user.entity';
import { Client } from '../clients/entities/client.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantUser } from '../tenants/entities/tenant-user.entity';
import { User } from '../users/entities/user.entity';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateClientInvitationDto } from './dto/create-client-invitation.dto';
import { CreateTenantInvitationDto } from './dto/create-tenant-invitation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { PasswordAuthDto } from './dto/password-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthInvitation } from './entities/auth-invitation.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const INVITATION_TTL_HOURS = 72;
const RESET_TTL_HOURS = 2;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(TenantUser)
    private readonly tenantUsersRepository: Repository<TenantUser>,
    @InjectRepository(ClientUser)
    private readonly clientUsersRepository: Repository<ClientUser>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(AuthInvitation)
    private readonly invitationsRepository: Repository<AuthInvitation>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetsRepository: Repository<PasswordReset>,
  ) {
    this.googleClientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async signInWithGoogle(dto: GoogleAuthDto) {
    if (!this.googleClientId) {
      throw new InternalServerErrorException('Google client id not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: this.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account not verified');
    }

    const user = await this.usersRepository.findOne({
      where: { email: payload.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not authorized');
    }

    if (user.oauthSubject && payload.sub && user.oauthSubject !== payload.sub) {
      throw new UnauthorizedException('OAuth subject mismatch');
    }

    const updates: Partial<User> = {
      lastLoginAt: new Date(),
    };

    if (!user.oauthSubject) {
      updates.oauthSubject = payload.sub ?? null;
    }

    if (!user.name && payload.name) {
      updates.name = payload.name;
    }

    await this.usersRepository.update(user.id, updates);

    return this.buildAuthResponse({ ...user, ...updates });
  }

  async signInWithPassword(dto: PasswordAuthDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersRepository.update(user.id, { lastLoginAt: new Date() });

    return this.buildAuthResponse(user);
  }

  async createTenantInvitation(
    actor: JwtPayload,
    dto: CreateTenantInvitationDto,
  ) {
    if (!actor.tenantId || actor.tenantId !== dto.tenantId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: dto.tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.type !== UserType.Controller) {
      throw new BadRequestException('User type mismatch');
    }

    if (existingUser) {
      const membership = await this.tenantUsersRepository.findOne({
        where: { userId: existingUser.id, tenantId: dto.tenantId },
      });

      if (membership) {
        throw new BadRequestException('User already assigned to this tenant');
      }
    }

    const { token, tokenHash } = generateTokenPair();
    const expiresAt = this.buildExpiryDate(INVITATION_TTL_HOURS);

    const invitation = this.invitationsRepository.create({
      tenantId: dto.tenantId,
      email: dto.email,
      name: dto.name,
      userType: UserType.Controller,
      role: dto.role,
      tokenHash,
      expiresAt,
      createdByUserId: actor.sub,
    });

    await this.invitationsRepository.save(invitation);

    return {
      invitationId: invitation.id,
      token,
      expiresAt,
    };
  }

  async createClientInvitation(
    actor: JwtPayload,
    dto: CreateClientInvitationDto,
  ) {
    if (!actor.tenantId || actor.tenantId !== dto.tenantId) {
      throw new ForbiddenException('Tenant scope mismatch');
    }

    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId, tenantId: dto.tenantId },
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }

    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.type !== UserType.Client) {
      throw new BadRequestException('User type mismatch');
    }

    if (existingUser) {
      const membership = await this.clientUsersRepository.findOne({
        where: { userId: existingUser.id, clientId: dto.clientId },
      });

      if (membership) {
        throw new BadRequestException('User already assigned to this client');
      }
    }

    const { token, tokenHash } = generateTokenPair();
    const expiresAt = this.buildExpiryDate(INVITATION_TTL_HOURS);

    const invitation = this.invitationsRepository.create({
      tenantId: dto.tenantId,
      clientId: dto.clientId,
      email: dto.email,
      name: dto.name,
      userType: UserType.Client,
      role: dto.role,
      tokenHash,
      expiresAt,
      createdByUserId: actor.sub,
    });

    await this.invitationsRepository.save(invitation);

    return {
      invitationId: invitation.id,
      token,
      expiresAt,
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const tokenHash = hashToken(dto.token);

    const invitation = await this.invitationsRepository.findOne({
      where: { tokenHash },
    });

    if (!invitation) {
      throw new BadRequestException('Invitation not found');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation already used');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitation expired');
    }

    const passwordHash = await hashPassword(dto.password);

    let user = await this.usersRepository.findOne({
      where: { email: invitation.email },
    });

    if (user) {
      if (user.type !== invitation.userType) {
        throw new BadRequestException('User type mismatch');
      }

      await this.usersRepository.update(user.id, {
        passwordHash,
      });
    } else {
      user = this.usersRepository.create({
        name: invitation.name,
        email: invitation.email,
        type: invitation.userType,
        oauthProvider: 'local',
        passwordHash,
        isActive: true,
      });

      user = await this.usersRepository.save(user);
    }

    if (invitation.userType === UserType.Controller) {
      const membership = await this.tenantUsersRepository.findOne({
        where: { tenantId: invitation.tenantId, userId: user.id },
      });

      if (!membership) {
        await this.tenantUsersRepository.save(
          this.tenantUsersRepository.create({
            tenantId: invitation.tenantId,
            userId: user.id,
            role: invitation.role as TenantRole,
            isActive: true,
          }),
        );
      } else {
        membership.role = invitation.role as TenantRole;
        membership.isActive = true;
        await this.tenantUsersRepository.save(membership);
      }
    } else {
      if (!invitation.clientId) {
        throw new BadRequestException('Client scope missing');
      }

      const membership = await this.clientUsersRepository.findOne({
        where: { clientId: invitation.clientId, userId: user.id },
      });

      if (!membership) {
        await this.clientUsersRepository.save(
          this.clientUsersRepository.create({
            clientId: invitation.clientId,
            userId: user.id,
            role: invitation.role as ClientRole,
            isActive: true,
          }),
        );
      } else {
        membership.role = invitation.role as ClientRole;
        membership.isActive = true;
        await this.clientUsersRepository.save(membership);
      }
    }

    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    return this.buildAuthResponse(user);
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      return { ok: true };
    }

    const { token, tokenHash } = generateTokenPair();
    const expiresAt = this.buildExpiryDate(RESET_TTL_HOURS);

    const reset = this.passwordResetsRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.passwordResetsRepository.save(reset);

    return {
      ok: true,
      token,
      expiresAt,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashToken(dto.token);

    const reset = await this.passwordResetsRepository.findOne({
      where: { tokenHash },
    });

    if (!reset) {
      throw new BadRequestException('Reset token not found');
    }

    if (reset.usedAt) {
      throw new BadRequestException('Reset token already used');
    }

    if (reset.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset token expired');
    }

    const passwordHash = await hashPassword(dto.password);

    await this.usersRepository.update(reset.userId, { passwordHash });

    reset.usedAt = new Date();
    await this.passwordResetsRepository.save(reset);

    return { ok: true };
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
      },
      tenantId: payload.tenantId,
      clientId: payload.clientId,
      role: payload.role,
    };
  }

  private async resolveMembership(user: User): Promise<{
    tenantId?: string;
    clientId?: string;
    role?: TenantRole | ClientRole;
  }> {
    if (user.type === UserType.Controller) {
      const membership = await this.tenantUsersRepository.findOne({
        where: { userId: user.id, isActive: true },
      });

      if (!membership) {
        throw new UnauthorizedException('Tenant membership not found');
      }

      return {
        tenantId: membership.tenantId,
        role: membership.role,
      };
    }

    const membership = await this.clientUsersRepository.findOne({
      where: { userId: user.id, isActive: true },
    });

    if (!membership) {
      throw new UnauthorizedException('Client membership not found');
    }

    return {
      clientId: membership.clientId,
      role: membership.role,
    };
  }

  private async buildAuthResponse(user: User) {
    const { tenantId, clientId, role } = await this.resolveMembership(user);

    const jwtPayload: JwtPayload = {
      sub: user.id,
      type: user.type,
      tenantId,
      clientId,
      role,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
      },
      tenantId,
      clientId,
      role,
    };
  }

  private buildExpiryDate(hours: number): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + hours);
    return expiresAt;
  }
}
