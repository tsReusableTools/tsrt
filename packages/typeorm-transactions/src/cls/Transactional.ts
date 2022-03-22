/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { ITransactionOptions, ITransactionOptionsExtended, Transaction } from './Transaction';
import { TransactionManager } from './TransactionManager';
import { execInTransactionsNamespace } from './utils';

/**
 * Factory for `Transactional` decorator. Extended options could be provided into factory.
 * Resulting decorator will use associated w/ it `TransactionManager` instance.
 *
 * @param [extendedOptions] - TrasnactionManager transaction options (no connection options etc.).
 */
export function createTransactional(
  extendedOptions?: ITransactionOptionsExtended,
): (options?: ITransactionOptions) => MethodDecorator {
  const tm = new TransactionManager(extendedOptions);

  /* eslint-disable-next-line @typescript-eslint/no-shadow */
  return function Transactional(options?: ITransactionOptions): MethodDecorator {
    return function TransactionalDecorator(_target: Object, _propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
      const originalMethod = descriptor.value;

      const newDescriptor = descriptor;
      newDescriptor.value = function newMethod(...args: unknown[]) {
        return execInTransactionsNamespace(async () => tm.autoTransaction(() => originalMethod.apply(this, args), { ...options }));
      };
      return newDescriptor;
    };
  };
}

/**
 * Basic `Transactional` decorator w/ ability to provide extended options (connection, etc.)
 *
 * @param [options] - Extended Trasnaction options as for `Transaction` constructor.
 */
export function Transactional(options: ITransactionOptionsExtended): MethodDecorator {
  return function TransactionalDecorator(_target: Object, _propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;

    const newDescriptor = descriptor;
    newDescriptor.value = async function newMethod(...args: unknown[]) {
      return execInTransactionsNamespace(async () => {
        const t = new Transaction(options);
        try {
          await t.begin();
          const result = await originalMethod.apply(this, args);
          await t.commit();
          return result;
        } catch (err) {
          await t.rollback(err);
        }
      });
    };
    return newDescriptor;
  };
}
