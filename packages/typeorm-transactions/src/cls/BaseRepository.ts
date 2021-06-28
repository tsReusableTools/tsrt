import { Repository, ObjectLiteral, EntityManager, getManager } from 'typeorm';

import { getManagerFromNs } from './utils';

// eslint-disable-next-line @typescript-eslint/ban-types
export function patchTypeOrmRepository(repository: Object): void {
  Object.defineProperty(repository, 'manager', {
    get() {
      const connectionName = this._originalManager?.connection?.name;
      const manager = getManagerFromNs(connectionName);
      return manager ?? this._originalManager ?? getManager(connectionName);
    },
    set(manager: EntityManager) {
      this._originalManager = manager;
    },
  });
}

export class BaseRepository<Entity extends ObjectLiteral> extends Repository<Entity> { }

patchTypeOrmRepository(BaseRepository.prototype);
