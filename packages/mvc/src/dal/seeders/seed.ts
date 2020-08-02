import { Sequelize } from 'sequelize-typescript';

import { OrmSequelize } from '@tsu/orm-sequelize';
import { getObjectValuesList } from '@tsu/utils';
import * as Models from '@dal/models';
import { UsersRepository, RolesRepository, PermissionsRepository } from '@dal/repositories';
import { IUser, IRole, IPermission } from '@lib/interfaces';

function getIds<T extends GenericObject>(list: T[]): number[] {
  return list ? list.map((item) => (item.id ? item.id : item)) : [];
}

async function createPermissions(): Promise<IPermission[]> {
  const permissions: Array<Partial<IPermission>> = [
    { title: 'Users.Read' },
    { title: 'Users.Write' },
  ];

  const result = await PermissionsRepository.bulkCreate(permissions);
  if (result.status < 400) return result.data;
}

async function createRoles(permissions?: IPermission[]): Promise<IRole[]> {
  const roles: Array<Partial<IRole>> = [
    { title: 'Admin', permissions: getIds(permissions) },
    { title: 'Manager', permissions: getIds(permissions) },
  ];

  const result = await RolesRepository.bulkCreate(roles);
  if (result.status < 400) return result.data;
}

async function createUsers(roles?: IRole[]): Promise<IUser[]> {
  const users: Array<Partial<IUser>> = [
    { email: 'dev@gmail.com', password: 'qaz12345', name: 'Dev', roles: getIds(roles) },
    { email: 'dev2@gmail.com', password: 'qaz12345', name: 'Dev2', roles: getIds(roles) },
  ];

  const result = await UsersRepository.bulkCreate(users);
  if (result.status < 400) return result.data;
}

async function seed(): Promise<void> {
  await OrmSequelize.init(Sequelize, { models: getObjectValuesList(Models) });
  await OrmSequelize.sync(true);

  const permissions = await createPermissions();
  const roles = await createRoles(permissions);
  await createUsers(roles);
}

seed();
