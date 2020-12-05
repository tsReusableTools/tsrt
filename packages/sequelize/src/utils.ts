import { IBaseRepositoryConfig } from './interfaces';

export const primaryKey = 'id';

export const defaultConfig: IBaseRepositoryConfig = {
  defaults: {
    primaryKey,
    restrictedProperties: [primaryKey, 'createdAt', 'updatedAt', 'deletedAt'],
    limit: 10,
    order: [primaryKey, 'asc'],
  },
};
