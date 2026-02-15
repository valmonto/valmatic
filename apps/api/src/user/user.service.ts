import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as bcrypt from 'bcryptjs';
import { k } from '@pkg/locales';
import { SECURITY_CONFIG } from '@pkg/server';
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersRequest,
  ListUsersResponse,
  GetUserByIdResponse,
  UpdateUserByIdRequest,
  UpdateUserByIdResponse,
  ActiveUser,
} from '@pkg/contracts';
import { UserRepository } from './user.repository';

const { BCRYPT_ROUNDS } = SECURITY_CONFIG;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
  ) {}

  async listUsers(activeUser: ActiveUser, dto: ListUsersRequest): Promise<ListUsersResponse> {
    const { data, total } = await this.userRepository.findUsersInOrg(activeUser.orgId, {
      skip: dto.skip,
      limit: dto.limit,
      search: dto.search,
      role: dto.role,
    });

    return {
      data: data.map((u) => ({
        ...u,
        joinedAt: u.joinedAt.toISOString(),
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      meta: {
        total,
        skip: dto.skip,
        limit: dto.limit,
      },
    };
  }

  async getUserById(activeUser: ActiveUser, userId: string): Promise<GetUserByIdResponse> {
    const userRecord = await this.userRepository.findUserInOrg(userId, activeUser.orgId);

    if (!userRecord) {
      throw new NotFoundException(k.users.errors.notFoundInOrg);
    }

    return {
      ...userRecord,
      joinedAt: userRecord.joinedAt.toISOString(),
      createdAt: userRecord.createdAt.toISOString(),
      updatedAt: userRecord.updatedAt.toISOString(),
    };
  }

  async createUser(activeUser: ActiveUser, dto: CreateUserRequest): Promise<CreateUserResponse> {
    // Check if email already exists
    const existing = await this.userRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException(k.users.errors.emailExists);
    }

    // Only OWNER can create other OWNERs
    if (dto.role === 'OWNER' && activeUser.role !== 'OWNER') {
      throw new ForbiddenException(k.users.errors.onlyOwnersCanCreateOwners);
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const userRecord = await this.userRepository.createUserWithOrgMembership({
      email: dto.email,
      name: dto.name,
      passwordHash,
      phone: dto.phone,
      orgId: activeUser.orgId,
      role: dto.role,
    });

    this.logger.info(
      { userId: userRecord.id, email: dto.email, orgId: activeUser.orgId },
      'User created and added to organization',
    );

    return {
      ...userRecord,
      joinedAt: userRecord.joinedAt.toISOString(),
      createdAt: userRecord.createdAt.toISOString(),
      updatedAt: userRecord.updatedAt.toISOString(),
    };
  }

  async updateUser(
    activeUser: ActiveUser,
    dto: UpdateUserByIdRequest,
  ): Promise<UpdateUserByIdResponse> {
    // Check user exists in org
    const existing = await this.userRepository.findUserInOrg(dto.id, activeUser.orgId);
    if (!existing) {
      throw new NotFoundException(k.users.errors.notFoundInOrg);
    }

    // Prevent self-demotion for owners
    if (dto.id === activeUser.userId && dto.role && dto.role !== existing.role) {
      if (existing.role === 'OWNER') {
        throw new ForbiddenException(k.users.errors.ownersCannotChangeOwnRole);
      }
    }

    // Only OWNER can promote to OWNER
    if (dto.role === 'OWNER' && activeUser.role !== 'OWNER') {
      throw new ForbiddenException(k.users.errors.onlyOwnersCanPromote);
    }

    const updated = await this.userRepository.updateUser(dto.id, activeUser.orgId, {
      name: dto.name,
      displayName: dto.displayName,
      phone: dto.phone,
      role: dto.role,
    });

    if (!updated) {
      throw new NotFoundException(k.users.errors.notFound);
    }

    this.logger.info({ userId: dto.id, orgId: activeUser.orgId }, 'User updated');

    return {
      ...updated,
      joinedAt: updated.joinedAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async removeUser(activeUser: ActiveUser, userId: string): Promise<void> {
    // Check user exists in org
    const existing = await this.userRepository.findUserInOrg(userId, activeUser.orgId);
    if (!existing) {
      throw new NotFoundException(k.users.errors.notFoundInOrg);
    }

    // Prevent self-removal
    if (userId === activeUser.userId) {
      throw new ForbiddenException(k.users.errors.cannotRemoveSelf);
    }

    // Only OWNER can remove other OWNERs
    if (existing.role === 'OWNER' && activeUser.role !== 'OWNER') {
      throw new ForbiddenException(k.users.errors.onlyOwnersCanRemoveOwners);
    }

    // Remove from organization
    await this.userRepository.removeUserFromOrg(userId, activeUser.orgId);

    // Check if user is in any other orgs, if not delete the user entirely
    const orgCount = await this.userRepository.countUserOrgs(userId);
    if (orgCount === 0) {
      await this.userRepository.deleteUser(userId);
      this.logger.info({ userId }, 'User deleted (no remaining organizations)');
    } else {
      this.logger.info({ userId, orgId: activeUser.orgId }, 'User removed from organization');
    }
  }
}
