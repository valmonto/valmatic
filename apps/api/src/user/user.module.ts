import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { AdminUserController } from './admin-user.controller.js';
import { AdminUserService } from './admin-user.service.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';
import { AccountRepository } from './account.repository.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { IamService } from '@pkg/server';

@Module({
  controllers: [UserController, AdminUserController, AccountController],
  providers: [
    UserService,
    AdminUserService,
    AccountService,
    AccountRepository,
    UserRepository,
    IamService,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
