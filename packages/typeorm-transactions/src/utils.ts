/* eslint-disable max-classes-per-file */
import { getConnection as typeOrmGetConnection, Connection, EntityManager } from 'typeorm';
import { EventEmitter } from 'events';
import { getNamespace, createNamespace, Namespace } from 'cls-hooked';

const NAMESPACE = '__typeorm_transactions_namespace__';
const TRANSACTION_KEY = '__typeorm_transaction_key__';
// const DEFAULT_TRANSACTION_ID = 'default';
export const DEFAULT_TRANSACTION_ID = false;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type AnyFunction<T = any> = (...args: any) => T;

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

export function setTransactionIntoNs<T>(
  key: string | number, transaction: T,
): T {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.set(`${TRANSACTION_KEY}_${key}`, transaction);
}

export function getTransactionFromNs<T>(key: string | number): T {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.get(`${TRANSACTION_KEY}_${key}`);
}

export function removeTransactionFromNs(key: string | number): void {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) ns.set(`${TRANSACTION_KEY}_${key}`, null);
}

export function getConnection(
  connectionFactory: Connection | AnyFunction<Connection>,
  connectionNameFactory: string | AnyFunction<string>,
): Connection {
  const connection = typeof connectionFactory === 'function' ? connectionFactory() : connectionFactory;
  const connectionName = typeof connectionNameFactory === 'function' ? connectionNameFactory() : connectionNameFactory;
  const result = connection ?? typeOrmGetConnection(connectionName);
  if (!result.isConnected) throw Error('Please, initialize connection before creating `UnitOfWork` instance');
  return result;
}

export function hasProperty<O>(object: O, prop: keyof O): boolean {
  return !!Object.hasOwnProperty.call(object, prop);
}

// export function hasOneOfProperties<O>(object: O, props: Array<keyof O>): boolean {
//   return !!(props.find((item) => hasProperty(object, item)));
// }

export function hasOnlyProperties<O>(object: O, props: Array<keyof O>): boolean {
  const existingProps = Object.keys(object);
  return !(existingProps.find((item) => !props.includes(item as keyof O)));
}

export function hasOnlyOneOfProvidedProperties<O>(object: O, props: Array<keyof O>): boolean {
  return props.reduce((acc, curr) => (hasProperty(object, curr) ? acc + 1 : acc), 0) === 1;
}
