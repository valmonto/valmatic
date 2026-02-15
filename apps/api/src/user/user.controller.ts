import { Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ActiveUser, Roles, Role, ZodRequest } from '@pkg/server';
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
  @Roles(Role.OWNER, Role.ADMIN)
  async list(
    @Query() query: ListUsersRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<ListUsersResponse> {
    const dto = ListUsersRequestSchema.parse(query);
    return this.userService.listUsers(activeUser, dto);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  async get(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<GetUserByIdResponse> {
    return this.userService.getUserById(activeUser, id);
  }

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  async create(
    @ZodRequest(CreateUserRequestSchema) dto: CreateUserRequest,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<CreateUserResponse> {
    return this.userService.createUser(activeUser, dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @ZodRequest(UpdateUserByIdRequestSchema.omit({ id: true }))
    dto: Omit<UpdateUserByIdRequest, 'id'>,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<UpdateUserByIdResponse> {
    return this.userService.updateUser(activeUser, { ...dto, id });
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @ActiveUser() activeUser: ActiveUserType,
  ): Promise<DeleteUserByIdResponse> {
    await this.userService.removeUser(activeUser, id);
    return {};
  }
}
