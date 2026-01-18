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
import { ClientUser } from '../clients/entities/client-user.entity';
import { TenantUser } from '../tenants/entities/tenant-user.entity';
import { User } from '../users/entities/user.entity';
import { GoogleAuthDto } from './dto/google-auth.dto';
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

    let tenantId: string | undefined;
    let clientId: string | undefined;
    let role: TenantRole | ClientRole | undefined;

    if (user.type === UserType.Controller) {
      const membership = await this.tenantUsersRepository.findOne({
        where: { userId: user.id, isActive: true },
      });

      if (!membership) {
        throw new UnauthorizedException('Tenant membership not found');
      }

      tenantId = membership.tenantId;
      role = membership.role;
    } else {
      const membership = await this.clientUsersRepository.findOne({
        where: { userId: user.id, isActive: true },
      });

      if (!membership) {
        throw new UnauthorizedException('Client membership not found');
      }

      clientId = membership.clientId;
      role = membership.role;
    }

    user.lastLoginAt = new Date();
    if (!user.oauthSubject) {
      user.oauthSubject = payload.sub ?? null;
    }
    if (!user.name && payload.name) {
      user.name = payload.name;
    }

    await this.usersRepository.save(user);

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
}
