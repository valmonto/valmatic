import { Global, Module } from '@nestjs/common';
import { IamService } from '@pkg/server';
import { OrgModule } from '../../org/org.module.js';
import { MULTI_ORG } from '../../org/multi-org.js';
import { AdminOrgController } from './admin-org.controller.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

/**
 * The `organizations` add-on's part of the API: an account may belong to
 * many organizations — create one, switch between them, and the platform
 * admin's list of all. Its MULTI_ORG token tells core that each sign-up
 * founds its own organization (docs/addons.md).
 */
@Global()
@Module({
  imports: [OrgModule],
  controllers: [OrganizationsController, AdminOrgController],
  providers: [OrganizationsService, IamService, { provide: MULTI_ORG, useValue: true }],
  exports: [MULTI_ORG],
})
export class OrganizationsAddonModule {}

export { OrganizationsAddonModule as addonModule };
