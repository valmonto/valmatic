import { Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ActiveUser, Permissions, ZodRequest } from '@pkg/server';
import {
  CreateUserRequest,
  CreateUserRequestSchema,
  CreateUserResponse,
  DeleteUserByIdResponse,
  GetUserByIdResponse,
  ListUsersRequest,
  ListUsersRequestSchema,
  ListUsersResponse,
  UpdateUserByIdRequest,
  UpdateUserByIdRequestSchema,
  UpdateUserByIdResponse,
  type ActiveUser as ActiveUserType,
} from '@pkg/contracts';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions('user:list')
  async list(
    @Query() query: ListUsersRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListUsersResponse> {
    const dto = ListUsersRequestSchema.parse(query);
    return this.userService.listUsers(activeUser, dto);
  }

  @Get(':id')
  @Permissions('user:read')
  async get(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetUserByIdResponse> {
    return this.userService.getUserById(activeUser, id);
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
    @Param('id') id: string,
    @ZodRequest(UpdateUserByIdRequestSchema.omit({ id: true }))
    dto: Omit<UpdateUserByIdRequest, 'id'>,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<UpdateUserByIdResponse> {
    return this.userService.updateUser(activeUser, { ...dto, id });
  }

  @Delete(':id')
  @Permissions('user:delete')
  async remove(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteUserByIdResponse> {
    await this.userService.removeUser(activeUser, id);
    return {};
  }
}
