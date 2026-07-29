import { Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ActiveUser, Permissions, ZodRequest } from '@pkg/server';
import {
  CreateUserRequest,
  CreateUserRequestSchema,
  CreateUserResponse,
  DeleteUserByIdRequest,
  DeleteUserByIdRequestSchema,
  DeleteUserByIdResponse,
  GetUserByIdRequest,
  GetUserByIdRequestSchema,
  GetUserByIdResponse,
  ListUsersRequest,
  ListUsersRequestSchema,
  ListUsersResponse,
  UpdateUserByIdRequest,
  UpdateUserByIdRequestSchema,
  UpdateUserByIdResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';

/**
 * Every route takes its input through `@ZodRequest`, which validates body, query
 * string and path params together against one schema. Path segments win over the
 * payload, so `id` is whatever the URL says regardless of what was sent.
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions('user:list')
  async list(
    @ZodRequest(ListUsersRequestSchema) dto: ListUsersRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListUsersResponse> {
    return this.userService.listUsers(activeUser, dto);
  }

  @Get(':id')
  @Permissions('user:read')
  async get(
    @ZodRequest(GetUserByIdRequestSchema) dto: GetUserByIdRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetUserByIdResponse> {
    return this.userService.getUserById(activeUser, dto.id);
  }

  @Post()
  @Permissions('user:create')
  async create(
    @ZodRequest(CreateUserRequestSchema) dto: CreateUserRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateUserResponse> {
    return this.userService.createUser(activeUser, dto);
  }

  @Patch(':id')
  @Permissions('user:update')
  async update(
    @ZodRequest(UpdateUserByIdRequestSchema) dto: UpdateUserByIdRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<UpdateUserByIdResponse> {
    return this.userService.updateUser(activeUser, dto);
  }

  @Delete(':id')
  @Permissions('user:delete')
  async remove(
    @ZodRequest(DeleteUserByIdRequestSchema) dto: DeleteUserByIdRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteUserByIdResponse> {
    await this.userService.removeUser(activeUser, dto.id);
    return {};
  }
}
