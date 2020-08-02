import { Controller, Get, Post, Put, Delete, Status, QueryParams, PathParams, Required, BodyParams } from '@tsed/common';
import { Responses, Returns } from '@tsed/swagger';

import { IPagedData } from '@tsu/orm-sequelize';

import { Authorized } from '@api/middlewares';
import { CommonReadQueryParams, CommonReadListQueryParams } from '@api/utils';
import { PermissionsRepository } from '@dal/repositories';
import { IPermission } from '@dal/interfaces';

@Controller('/permissions')
@Authorized()
export class PermissionsController {
  @Post('/')
  @Status(201)
  public async create(
    @Required() @BodyParams() body: IPermission,
      @QueryParams('include') include?: string,
  ): Promise<IPermission> {
    return PermissionsRepository.create(body, { include });
  }

  @Get('/')
  @Status(200)
  public async readList(@QueryParams() query?: CommonReadListQueryParams): Promise<IPagedData<IPermission>> {
    return PermissionsRepository.read(query);
  }

  @Get('/:permissionId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  public async read(
    @Required() @PathParams('permissionId') permissionId: string,
      @QueryParams() query?: CommonReadQueryParams,
  ): Promise<IPermission> {
    return PermissionsRepository.read(query, permissionId);
  }

  @Put('/:permissionId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  public async update(
    @Required() @PathParams('permissionId') permissionId: string,
      @Required() @BodyParams() body: IPermission,
      @QueryParams('include') include?: string,
  ): Promise<IPermission> {
    return PermissionsRepository.update(body, permissionId, { include });
  }

  @Delete('/:permissionId')
  @Status(200)
  @Responses(404, { description: 'Not Found' })
  @Returns(String)
  public async delete(
    @Required() @PathParams('permissionId') permissionId: string,
  ): Promise<string> {
    return PermissionsRepository.delete(permissionId);
  }
}
