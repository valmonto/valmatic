import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { IamService } from '@pkg/server';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, IamService],
  exports: [UserService, UserRepository],
})
export class UserModule {}
