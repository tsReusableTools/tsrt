/* eslint-disable max-classes-per-file */
import { EntityManager, QueryRunner, getConnection as typeOrmGetConnection, Connection } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { EventEmitter } from 'events';
import { getNamespace, createNamespace, Namespace } from 'cls-hooked';

const NAMESPACE = '__typeorm_transactions_namespace__';
const TRANSACTION_KEY = '__typeorm_transaction_key__';
// const DEFAULT_TRANSACTION_ID = 'default';
const DEFAULT_TRANSACTION_ID = false;

export function createTransactionsNamespace(): Namespace {
  return getNamespace(NAMESPACE) ?? createNamespace(NAMESPACE);
}

export function getTransactionsNamespace(): Namespace {
  return getNamespace(NAMESPACE);
}

export function bindTransactionsNamespace(req: EventEmitter, res: EventEmitter, next: AnyFunction): void {
  const ns = createTransactionsNamespace();
  ns.bindEmitter(req);
  ns.bindEmitter(res);
  ns.run(() => next());
}

export async function execInTransactionsNamespace<R extends AnyFunction>(cb: R): Promise<ReturnType<R>> {
  return createTransactionsNamespace().runPromise(cb);
}

function setTransactionIntoNs<T extends Transaction>(
  key: string | number, transaction: T,
): T {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.set(`${TRANSACTION_KEY}_${key}`, transaction);
}

function getTransactionFromNs<T extends Repositories>(key: string | number): Transaction<T> {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.get(`${TRANSACTION_KEY}_${key}`);
}

function removeTransactionFromNs(key: string | number): void {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) ns.set(`${TRANSACTION_KEY}_${key}`, null);
}

function createRepositories<C extends Repositories>(
  repositories: C, manager: EntityManager, constructorParams?: RepositoryConstructorParams,
): RepositoriesInstances<C> {
  let params = typeof constructorParams === 'function' ? constructorParams() : constructorParams;
  if (!Array.isArray(params)) params = [params];

  const result: RepositoriesInstances<C> = { } as RepositoriesInstances<C>;
  Object.entries(repositories).forEach(([key, Repository]) => { result[key as keyof C] = new Repository(manager, ...params); });
  return result;
}

function getConnection(
  connectionFactory: Connection | AnyFunction<Connection>,
  connectionNameFactory: string | AnyFunction<string>,
): Connection {
  const connection = typeof connectionFactory === 'function' ? connectionFactory() : connectionFactory;
  const connectionName = typeof connectionNameFactory === 'function' ? connectionNameFactory() : connectionNameFactory;
  const result = connection ?? typeOrmGetConnection(connectionName);
  if (!result.isConnected) throw Error('Please, initialize connection before creating `UnitOfWork` instance');
  return result;
}

function hasProperty<O>(object: O, prop: keyof O): boolean {
  return !!Object.hasOwnProperty.call(object, prop);
}

// function hasOneOfProperties<O>(object: O, props: Array<keyof O>): boolean {
//   return !!(props.find((item) => hasProperty(object, item)));
// }

function hasOnlyProperties<O>(object: O, props: Array<keyof O>): boolean {
  const existingProps = Object.keys(object);
  return !(existingProps.find((item) => !props.includes(item as keyof O)));
}

function hasOnlyOneOfProvidedProperties<O>(object: O, props: Array<keyof O>): boolean {
  return props.reduce((acc, curr) => (hasProperty(object, curr) ? acc + 1 : acc), 0) === 1;
}

export class Transaction<T extends Repositories = Repositories> implements ITransaction<T> {
  protected _repositories: RepositoriesInstances<T>;
  protected _connection: Connection;
  protected readonly _queryRunner: QueryRunner;
  protected readonly _shouldUseNs: boolean;
  protected readonly _hasParentTransaction: boolean;
  protected readonly _transactionId?: string;
  protected readonly _parentTransaction?: Transaction<T>;

  constructor(protected readonly _options: ITransactionOptions<T>) {
    this._validateConnectionOptios(_options);

    const { connection, connectionName, manager, transaction, id = DEFAULT_TRANSACTION_ID } = _options;

    if (transaction) {
      this._parentTransaction = transaction;
      this._hasParentTransaction = true;
      this._shouldUseNs = transaction._shouldUseNs;
      this._connection = transaction._connection;
      this._transactionId = transaction._transactionId;
      this._queryRunner = transaction._queryRunner;
    } else {
      this._connection = manager?.connection ?? getConnection(connection, connectionName);
      this._transactionId = `${this._connection.name}__${id}`;
      this._parentTransaction = getTransactionFromNs(this._transactionId);
      this._validateParentTransaction();
      this._hasParentTransaction = !!manager?.queryRunner || !!this._parentTransaction;
      this._shouldUseNs = id !== false;
      this._queryRunner = manager?.queryRunner ?? this._parentTransaction?.queryRunner ?? this._connection.createQueryRunner();
    }

    if (this._shouldUseNs) {
      this._validateNsAvailability();
      setTransactionIntoNs(this._transactionId, this);
    }
  }

  public get repositories(): RepositoriesInstances<T> {
    if (!this._repositories) {
      const { repositories, repositoryConstructorParams } = this._options;
      this._repositories = createRepositories(repositories, this.manager, repositoryConstructorParams);
    }
    return this._repositories;
  }

  public get manager(): EntityManager {
    return this._queryRunner.manager;
  }

  public get id(): string | number | boolean {
    return this._options.id;
  }

  public get queryRunner(): QueryRunner {
    return this._queryRunner;
  }

  public async begin(): Promise<void> {
    if (this._hasParentTransaction) return;
    if (!this._queryRunner.isTransactionActive) await this._queryRunner.startTransaction(this._options.isolationLevel);
    else throw new Error('Transaction is already started');
  }

  public async commit(): Promise<void> {
    if (this._hasParentTransaction) return;
    if (this._queryRunner.isTransactionActive && !this._options.manager?.queryRunner) await this._queryRunner.commitTransaction();
    if (!this._queryRunner.isReleased && !this._options.manager?.queryRunner) await this._queryRunner.release();
    if (this._shouldUseNs) removeTransactionFromNs(this._transactionId);
  }

  public async rollback(error?: string | Error): Promise<void> {
    if (this._hasParentTransaction) return;
    if (this._queryRunner.isTransactionActive && !this._options.manager?.queryRunner) await this._queryRunner.rollbackTransaction();
    if (!this._queryRunner.isReleased && !this._options.manager?.queryRunner) await this._queryRunner.release();
    if (this._shouldUseNs) removeTransactionFromNs(this._transactionId);
    if (error && typeof error === 'string') throw new Error(error);
    else if (error) throw error;
  }

  protected _validateNsAvailability(): void {
    if (!this._shouldUseNs) return;
    const ns = getTransactionsNamespace();
    if (!ns) throw new Error('Please, create Namespace using `createTransactionsNamespace` method.');
    if (!ns.active) throw new Error('Please, bind Namespace using `bindTransactionsNamespace` or `execInTransactionsNamespace` method.');
  }

  protected _validateConnectionOptios(options: ITransactionOptions<T> = { }): void {
    if (options.transaction && !hasOnlyProperties(options, ['transaction'])) {
      throw new Error('If option `transaction` is provided it is forbidden to provide any other options.');
    }

    if (!hasOnlyOneOfProvidedProperties(options, ['manager', 'connection', 'connectionName'])) return;
    throw new Error('Please, provide only one option of: `manager`, `connection`, `connectionName`.');
  }

  protected _validateParentTransaction(): void {
    if (this._parentTransaction && this._connection.name !== this._parentTransaction.manager.connection.name) {
      throw new Error('Parent transaction, provided either via `transaction` or `id` options, uses another connection.');
    }
  }
}

export class UnitOfWork<T extends Repositories = Repositories> implements IUnitOfWork<T> {
  protected _repositories: RepositoriesInstances<T>;
  protected _connection: Connection;

  constructor(protected readonly _options: IUnitOfWorkOptions<T> = { }) { }

  public async exec<R>(cb: UnitOfWorkExecutor<T, R>): Promise<R> {
    const { connection, connectionName, manager, isolationLevel } = this._options;
    this._connection = getConnection(connection, connectionName);
    const getRepositories = this._getRepositories.bind(this);

    const execute = async (mgr: EntityManager): Promise<R> => cb({ manager: mgr, get repositories() { return getRepositories(mgr); } });
    return manager ? execute(manager) : this._connection.transaction(isolationLevel, execute);
  }

  protected _getRepositories(manager: EntityManager): RepositoriesInstances<T> {
    if (!this._repositories) {
      const { repositories, repositoryConstructorParams } = this._options;
      this._repositories = createRepositories(repositories, manager, repositoryConstructorParams);
    }
    return this._repositories;
  }
}

export class TransactionManager<T extends Repositories = Repositories> {
  protected _repositories: RepositoriesInstances<T>;
  protected _connection: Connection;

  constructor(protected readonly _options: ITransactionManagerOptions<T> = { }) { }

  public async unitOfWork<R>(cb: UnitOfWorkExecutor<T, R>, options: UnitOfWorkExecutorOptions<T> = { }): Promise<R> {
    return this.createUnitOfWork(options).exec(cb);
  }

  public createUnitOfWork<C extends Repositories = T>(options: UnitOfWorkExecutorOptions<C> = { }): UnitOfWork<C> {
    return new UnitOfWork(this._getDefaults(options));
  }

  public async transaction<C extends Repositories = T>(options?: TransactionExecutorOptions<C>): Promise<Transaction<C>>;
  public async transaction<C extends Repositories = T, R = unknown>(
    cb: TransactionExecutor<C, R>, options?: TransactionExecutorOptions<C>,
  ): Promise<R>;
  public async transaction<C extends Repositories = T, R = unknown>(
    cbOrOptions: TransactionExecutorOptions<C> | TransactionExecutor<C, R>, options?: TransactionExecutorOptions<C>,
  ): Promise<Transaction<C> | R> {
    const opts = this._getDefaults(typeof cbOrOptions === 'function' ? options : cbOrOptions);
    const transaction = this.createTransaction(opts);

    if (!transaction.queryRunner.isTransactionActive) await transaction.begin();

    return typeof cbOrOptions === 'function'
      ? cbOrOptions(transaction)
        .then(async (result) => { await transaction.rollback(); return result; })
        .catch(async (err) => await transaction.rollback(err) as unknown as R)
      : transaction;
  }

  public createTransaction<C extends Repositories = T>(options: TransactionExecutorOptions<C> = { }): Transaction<C> {
    return new Transaction(this._getDefaults(options));
  }

  public get connection(): Connection {
    const { manager, connection, connectionName } = this._options;
    if (!this._connection) this._connection = manager?.connection ?? getConnection(connection, connectionName);
    return this._connection;
  }

  public get repositories(): RepositoriesInstances<T> {
    if (!this._repositories) {
      const { repositories, repositoryConstructorParams } = this._options;
      this._repositories = createRepositories(repositories, this.connection.manager, repositoryConstructorParams);
    }
    return this._repositories;
  }

  protected _getDefaults<O extends TransactionExecutorOptions>(options?: O): O {
    const result = {
      ...options,
      connection: this.connection,
      connectionName: this.connection.name,
      repositories: options?.repositories ?? this._options?.repositories,
      repositoryConstructorParams: options?.repositoryConstructorParams ?? this._options?.repositoryConstructorParams,
      isolationLevel: options?.isolationLevel ?? this._options?.isolationLevel,
      id: options?.id ?? this._options?.defaultTransactionId,
    } as O;
    this._validateOptions(result);
    return result;
  }

  protected _validateOptions(options: TransactionExecutorOptions): void {
    const { manager, transaction } = options;
    if (manager && manager.connection.name !== this.connection.name) {
      throw new Error('Provided `manager` option with invalid (another) connection');
    }

    if (transaction && transaction.manager.connection.name !== this.connection.name) {
      throw new Error('Provided `transaction` option with invalid (another) connection');
    }
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type AnyFunction<T = any> = (...args: any) => T;
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type Repository<T = any> = new (manager: EntityManager, ...args: any[]) => T;
export type Repositories = Record<string, Repository>;
export type RepositoriesInstances<T extends Repositories> = { [K in keyof T]: InstanceType<T[K]> };
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type RepositoryConstructorParams = (() => any[]) | any[];

export interface ITransactionManagerOptions<T extends Repositories = Repositories> extends ITransactionOptions<T> {
  defaultTransactionId?: string | number | boolean;
}

export interface ITransaction<T extends Repositories> {
  manager: EntityManager;
  repositories: RepositoriesInstances<T>;
  id?: string | number | boolean;
  queryRunner: QueryRunner;
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(error?: string | Error): Promise<void>;
}

export interface ITransactionOptions<T extends Repositories = Repositories> extends IUnitOfWorkOptions<T> {
  id?: string | number | false;
  transaction?: Transaction<T>;
}

export type TransactionExecutor<T extends Repositories = Repositories, R = unknown> = (transaction: Transaction<T>) => Promise<R>;

export type TransactionExecutorOptions<T extends Repositories = Repositories> =
  Omit<ITransactionOptions<T>, 'connection' | 'connectionName'>;

export interface IUnitOfWork<T extends Repositories = Repositories> {
  exec<R>(cb: UnitOfWorkExecutor<T, R>): Promise<R>;
}

export interface IUnitOfWorkOptions<T extends Repositories = Repositories> {
  connection?: Connection | AnyFunction<Connection>;
  connectionName?: string | AnyFunction<string>;
  manager?: EntityManager;
  repositories?: T;
  repositoryConstructorParams?: RepositoryConstructorParams;
  isolationLevel?: IsolationLevel;
}

export type UnitOfWorkExecutor<T extends Repositories = Repositories, R = unknown> =
  (unitOfWork: UnitOfWorkExecutorPayload<T>) => Promise<R>;

export type UnitOfWorkExecutorPayload<T extends Repositories = Repositories> = {
  manager: EntityManager;
  repositories: RepositoriesInstances<T>;
}

export type UnitOfWorkExecutorOptions<T extends Repositories = Repositories> =
  Omit<IUnitOfWorkOptions<T>, 'connection' | 'connectionName'>;

export type ITransactionable<T extends Repositories = Repositories> = {
  transaction?: ITransaction<T>;
}
