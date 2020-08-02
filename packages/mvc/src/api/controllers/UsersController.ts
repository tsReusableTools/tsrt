import { Controller, Get, Post, Put, Delete, Status, QueryParams, PathParams, Required, BodyParams } from '@tsed/common';
import { Responses, Returns } from '@tsed/swagger';

import { IPagedData } from '@tsu/orm-sequelize';

import { Authorized } from '@api/middlewares';
import { CommonReadQueryParams, CommonReadListQueryParams } from '@api/utils';
import { UsersRepository } from '@dal/repositories';
import { IUser } from '@dal/interfaces';

@Controller('/users')
@Authorized()
export class UsersController {
  @Post('/')
  @Status(201)
  public async create(
    @Required() @BodyParams() body: IUser,
      @QueryParams('include') include?: string,
  ): Promise<IUser> {
    return UsersRepository.create(body, { include });
  }

  @Get('/')
  @Status(200)
  public async readList(@QueryParams() query?: CommonReadListQueryParams): Promise<IPagedData<IUser>> {
    return UsersRepository.read(query);
  }

  @Get('/:userId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  public async read(
    @Required() @PathParams('userId') userId: string,
      @QueryParams() query?: CommonReadQueryParams,
  ): Promise<IUser> {
    return UsersRepository.read(query, userId);
  }

  @Put('/:userId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  public async update(
    @Required() @PathParams('userId') userId: string,
      @Required() @BodyParams() body: IUser,
      @QueryParams('include') include?: string,
  ): Promise<IUser> {
    return UsersRepository.update(body, userId, { include });
  }

  @Delete('/:userId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  @Returns(String)
  public async delete(
    @Required() @PathParams('userId') userId: string,
  ): Promise<string> {
    return UsersRepository.delete(userId);
  }
}
