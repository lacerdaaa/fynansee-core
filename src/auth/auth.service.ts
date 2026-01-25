import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { ClientRole, TenantRole, UserType } from '../common/enums/access.enum';
import { verifyPassword } from '../common/utils/password.util';
import { ClientUser } from '../clients/entities/client-user.entity';
import { TenantUser } from '../tenants/entities/tenant-user.entity';
import { User } from '../users/entities/user.entity';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { PasswordAuthDto } from './dto/password-auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

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
}
