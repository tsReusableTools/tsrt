import { Repository, ObjectLiteral, EntityManager, getManager, Connection } from 'typeorm';

import { getManagerFromNs, AnyFunction, getConnection } from './utils';

/**
 * Patches provided class prototype `manager` property to try to use EntityManager form Cls Namespace, and fallback to default.
 *
 * @param repository - Repository class to be patched. @default require('typeorm').Repository. @example Repository || Repository.prototype.
 * @param options - Optional options to be used for getting manager connection. Mostly you won't need it.
 */
export function patchTypeOrmRepository(
  /* eslint-disable-next-line */
  repository: AnyFunction | Object = require('typeorm').Repository,
  options: IPatchRepositoryOptions = { },
): void {
  const prototype = (repository as AnyFunction).prototype ?? repository;

  Object.defineProperty(prototype, 'manager', {
    get() {
      const connectionName = this._originalManager?.connection?.name ?? getConnection(options.connection, options.connectionName)?.name;
      const manager = getManagerFromNs(connectionName);
      return manager ?? this._originalManager ?? getManager(connectionName);
    },
    set(manager: EntityManager) {
      this._originalManager = manager;
    },
  });
}

export interface IPatchRepositoryOptions {
  connection?: Connection | AnyFunction<Connection>;
  connectionName?: string | AnyFunction<string>;
}

export class BaseRepository<Entity extends ObjectLiteral> extends Repository<Entity> { }

patchTypeOrmRepository(BaseRepository);
