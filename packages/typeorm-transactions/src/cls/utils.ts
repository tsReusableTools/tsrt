/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable max-classes-per-file */
import { getConnection as typeOrmGetConnection, Connection, EntityManager, getMetadataArgsStorage } from 'typeorm';
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';
import { EventEmitter } from 'events';
import { getNamespace, createNamespace, Namespace } from 'cls-hooked';

const NAMESPACE = '__typeorm_transactions_namespace__';
const TRANSACTION_KEY = '__typeorm_transaction_key__';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type AnyFunction<T = any> = (...args: any) => T;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type GenericObject<T = any> = { [x: string]: T };

// Cls Namespace related utils
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

export function setManagerIntoNs(connectionName: string, manager: EntityManager): EntityManager {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.set(`${TRANSACTION_KEY}_${connectionName}`, manager);
}

export function getManagerFromNs(connectionName: string): EntityManager {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.get(`${TRANSACTION_KEY}_${connectionName}`);
}

export function removeManagerFromNs(connectionName: string): EntityManager {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.set(`${TRANSACTION_KEY}_${connectionName}`, null);
}

// TypeORM related utils
export function getConnection(
  connectionFactory: Connection | AnyFunction<Connection>,
  connectionNameFactory: string | AnyFunction<string>,
): Connection {
  const connection = typeof connectionFactory === 'function' ? connectionFactory() : connectionFactory;
  const connectionName = typeof connectionNameFactory === 'function' ? connectionNameFactory() : connectionNameFactory;
  const result = connection ?? typeOrmGetConnection(connectionName);
  if (!result.isConnected) throw new Error('Please, initialize TypeORM connection.');
  return result;
}

export function insertIntoClass<C, T>(context: C, data: T): void {
  if (!data || !context) throw new Error('It is necessary to provide both: data and context');
  Object.entries(data).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    // eslint-disable-next-line no-param-reassign
    (context as GenericObject)[key] = value;
  });
}

function getPrototypes(target: Function): Function[] {
  let result: Function[] = [target];
  if (Object.getPrototypeOf(target)?.name) result = result.concat(getPrototypes(Object.getPrototypeOf(target)));
  return result;
}

export function getEntityColumns(target: Function): ColumnMetadataArgs[] {
  let result: ColumnMetadataArgs[] = [];
  getPrototypes(target).forEach((item) => { result = result.concat(getMetadataArgsStorage().filterColumns(item)); });
  return result;
}

export function insertEntityProperties<C, T>(context: C, data: T): void {
  if (!data) return;
  const properties = getEntityColumns(context.constructor)?.map(({ propertyName }) => propertyName);
  const filteredData: GenericObject = { };
  Object.entries(data).forEach(([key, value]) => { if (properties?.includes(key)) filteredData[key] = value; });
  insertIntoClass(context, filteredData);
}
