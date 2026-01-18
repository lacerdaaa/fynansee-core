import { AppDataSource } from '../data-source';
import { TenantRole, UserType } from '../common/enums/access.enum';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantUser } from '../tenants/entities/tenant-user.entity';
import { User } from '../users/entities/user.entity';

async function bootstrap() {
  const tenantName =
    process.env.BOOTSTRAP_TENANT_NAME ?? 'Primary Controladoria';
  const ownerName = process.env.BOOTSTRAP_OWNER_NAME ?? 'Owner';
  const ownerEmail = process.env.BOOTSTRAP_OWNER_EMAIL;

  if (!ownerEmail) {
    throw new Error('BOOTSTRAP_OWNER_EMAIL is required');
  }

  await AppDataSource.initialize();

  const tenantRepo = AppDataSource.getRepository(Tenant);
  const userRepo = AppDataSource.getRepository(User);
  const tenantUserRepo = AppDataSource.getRepository(TenantUser);

  let tenant = await tenantRepo.findOne({ where: { name: tenantName } });

  if (!tenant) {
    tenant = tenantRepo.create({ name: tenantName, isActive: true });
    tenant = await tenantRepo.save(tenant);
  }

  let user = await userRepo.findOne({ where: { email: ownerEmail } });

  if (user && user.type !== UserType.Controller) {
    throw new Error('User type mismatch for bootstrap owner');
  }

  if (!user) {
    user = userRepo.create({
      name: ownerName,
      email: ownerEmail,
      type: UserType.Controller,
      oauthProvider: 'google',
      isActive: true,
    });
    user = await userRepo.save(user);
  }

  let membership = await tenantUserRepo.findOne({
    where: { tenantId: tenant.id, userId: user.id },
  });

  if (!membership) {
    membership = tenantUserRepo.create({
      tenantId: tenant.id,
      userId: user.id,
      role: TenantRole.Owner,
      isActive: true,
    });
    membership = await tenantUserRepo.save(membership);
  } else if (membership.role !== TenantRole.Owner || !membership.isActive) {
    membership.role = TenantRole.Owner;
    membership.isActive = true;
    membership = await tenantUserRepo.save(membership);
  }

  console.log('Bootstrap complete');
  console.log('Tenant:', tenant.id, tenant.name);
  console.log('Owner:', user.id, user.email);
  console.log('Membership:', membership.id, membership.role);

  await AppDataSource.destroy();
}

bootstrap().catch(async (error) => {
  console.error('Bootstrap failed');
  console.error(error);

  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  } catch (shutdownError) {
    console.error('Failed to close data source');
    console.error(shutdownError);
  }

  process.exit(1);
});
