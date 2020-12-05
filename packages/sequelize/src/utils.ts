import { IBaseRepositoryConfig } from './interfaces';

export const defaultConfig: IBaseRepositoryConfig = {
  defaults: {
    restrictedProperties: ['createdAt', 'updatedAt', 'deletedAt'],
    limit: 10,
  },
};
