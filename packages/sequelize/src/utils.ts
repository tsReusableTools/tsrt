import { IBaseRepositoryConfig, IDatabaseConfig } from './interfaces';

export const defaultBaseRepositoryConfig: IBaseRepositoryConfig = {
  defaults: {
    restrictedProperties: ['createdAt', 'updatedAt', 'deletedAt'],
    limit: 10,
    logError: process.env.NODE_ENV !== 'production',
  },
  orderingServiceConfig: {
    orderKey: 'order',
  },
};

export const defaultDatabaseConfig: IDatabaseConfig = { sync: false, logConnectionInfo: true };
