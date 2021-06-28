/* eslint-disable max-classes-per-file */
import { getConnection as typeOrmGetConnection, Connection, EntityManager } from 'typeorm';
import { EventEmitter } from 'events';
import { getNamespace, createNamespace, Namespace } from 'cls-hooked';

const NAMESPACE = '__typeorm_transactions_namespace__';
const TRANSACTION_KEY = '__typeorm_transaction_key__';

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

export function removeManagerFromNs(connectionName: string): EntityManager {
  const ns = getTransactionsNamespace();
  if (ns && ns.active) return ns.set(`${TRANSACTION_KEY}_${connectionName}`, null);
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
