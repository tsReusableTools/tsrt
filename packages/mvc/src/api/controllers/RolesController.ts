import { Controller, Get, Post, Put, Delete, Status, QueryParams, PathParams, Required, BodyParams } from '@tsed/common';
import { Responses, Returns } from '@tsed/swagger';

import { IPagedData } from '@tsu/orm-sequelize';

import { Authorized } from '@api/middlewares';
import { CommonReadQueryParams, CommonReadListQueryParams } from '@api/utils';
import { RolesRepository } from '@dal/repositories';
import { IRole } from '@dal/interfaces';

@Controller('/roles')
@Authorized()
export class RolesController {
  @Post('/')
  @Status(201)
  public async create(
    @Required() @BodyParams() body: IRole,
      @QueryParams('include') include?: string,
  ): Promise<IRole> {
    return RolesRepository.create(body, { include });
  }

  @Get('/')
  @Status(200)
  public async readList(@QueryParams() query?: CommonReadListQueryParams): Promise<IPagedData<IRole>> {
    return RolesRepository.read(query);
  }

  @Get('/:roleId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  public async read(
    @Required() @PathParams('roleId') roleId: string,
      @QueryParams() query?: CommonReadQueryParams,
  ): Promise<IRole> {
    return RolesRepository.read(query, roleId);
  }

  @Put('/:roleId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  public async update(
    @Required() @PathParams('roleId') roleId: string,
      @Required() @BodyParams() body: IRole,
      @QueryParams('include') include?: string,
  ): Promise<IRole> {
    return RolesRepository.update(body, roleId, { include });
  }

  @Delete('/:roleId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  @Returns(String)
  public async delete(
    @Required() @PathParams('roleId') roleId: string,
  ): Promise<string> {
    return RolesRepository.delete(roleId);
  }
}
