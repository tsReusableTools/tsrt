import { IBaseRepositoryConfig, IDatabaseConfig } from './interfaces';

export const defaultBaseRepositoryConfig: IBaseRepositoryConfig = {
  defaults: {
    restrictedProperties: ['createdAt', 'updatedAt', 'deletedAt'],
    limit: 10,
    logError: process.env.NODE_ENV !== 'production',
  },
  orderingServiceOptions: {
    orderKey: 'order',
    clampRange: true,
    insertAfterOnly: true,
  },
};

export const defaultDatabaseConfig: IDatabaseConfig = { sync: false, logConnectionInfo: true };
