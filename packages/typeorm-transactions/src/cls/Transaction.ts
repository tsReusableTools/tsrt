import { EntityManager, Connection, QueryRunner } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

import {
  AnyFunction,
  getTransactionsNamespace, getConnection, setManagerIntoNs, getManagerFromNs, removeManagerFromNs,
} from './utils';

export class Transaction implements ITransaction {
  protected readonly _connection: Connection;
  protected readonly _queryRunner: QueryRunner;
  protected readonly _manager: EntityManager;
  protected readonly _shouldUseParentManager: boolean;
  protected readonly _parentManager: EntityManager;

  constructor(protected readonly _options?: ITransactionOptionsExtended) {
    const { connection, connectionName, manager, propagation } = _options;

    this._connection = manager?.connection ?? getConnection(connection, connectionName); // Necessary for _transactionId
    this._parentManager = getManagerFromNs(this._transactionId);
    this._manager = manager ?? this._parentManager ?? this._connection.manager;

    switch (propagation) {
      case 'SUPPORT': {
        this._shouldUseParentManager = true;
        this._queryRunner = this._manager?.queryRunner;
        break;
      }

      case 'SEPARATE': {
        this._connection = getConnection(connection, connectionName); // Necessary for _transactionId
        this._parentManager = getManagerFromNs(this._transactionId); // To retrieve it back later
        this._shouldUseParentManager = false;
        this._queryRunner = this._connection.createQueryRunner();
        this._saveManager(this.manager);
        break;
      }

      case 'REQUIRED':
      default: {
        this._shouldUseParentManager = !!manager?.queryRunner || !!this._parentManager;
        this._queryRunner = this._manager?.queryRunner ?? this._manager.connection.createQueryRunner();
        if (!this._shouldUseParentManager) this._saveManager(this.manager);
        break;
      }
    }
  }

  public get manager(): EntityManager {
    return this._queryRunner.manager ?? this._manager;
  }

  public async begin(): Promise<void> {
    if (this._shouldUseParentManager) return;
    if (!this._queryRunner.isTransactionActive) {
      await this._queryRunner.connect();
      await this._queryRunner.startTransaction(this._options?.isolationLevel);
    } else throw new Error('Transaction is already started');
  }

  public async commit(): Promise<void> {
    if (this._shouldUseParentManager) return;
    if (this._isTransactionActive) await this._queryRunner.commitTransaction();
    await this._endTransaction();
  }

  public async rollback(error?: string | Error): Promise<void> {
    if (!this._shouldUseParentManager) {
      if (this._isTransactionActive) await this._queryRunner.rollbackTransaction();
      await this._endTransaction();
    }
    if (error && typeof error === 'string') throw new Error(error);
    else if (error) throw error;
  }

  protected get _transactionId(): string { return this._connection.name; }

  protected get _isTransactionActive(): boolean { return this._queryRunner?.isTransactionActive && !this._options?.manager?.queryRunner; }

  protected get _isTransactionNotReleased(): boolean { return !this._queryRunner?.isReleased && !this._options?.manager?.queryRunner; }

  protected _saveManager(manager: EntityManager): void {
    this._validateNsAvailability();
    setManagerIntoNs(this._transactionId, manager);
  }

  protected async _endTransaction(): Promise<void> {
    if (this._isTransactionNotReleased) await this._queryRunner.release();
    removeManagerFromNs(this._transactionId);
    if (this._parentManager && !this._shouldUseParentManager) setManagerIntoNs(this._transactionId, this._parentManager);
  }

  protected _validateNsAvailability(): void {
    const ns = getTransactionsNamespace();
    if (!ns) throw new Error('Please, create Namespace using `createTransactionsNamespace` method.');
    if (!ns.active) throw new Error('Please, bind Namespace using `bindTransactionsNamespace` or `execInTransactionsNamespace` method.');
  }
}

export type Propagation = 'REQUIRED' | 'SUPPORT' | 'SEPARATE';

export interface ITransaction {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(err?: string | Error): Promise<void>;
}

export interface ITransactionOptions {
  propagation?: Propagation;
  isolationLevel?: IsolationLevel;
}

export interface ITransactionOptionsExtended extends ITransactionOptions {
  connection?: Connection | AnyFunction<Connection>;
  connectionName?: string | AnyFunction<string>;
  manager?: EntityManager;
  propagation?: Propagation;
  isolationLevel?: IsolationLevel;
}
