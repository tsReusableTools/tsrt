/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { ITransactionOptions, ITransactionOptionsExtended, Transaction } from './Transaction';
import { TransactionManager } from './TransactionManager';

export function createTransactional(
  extendedOptions?: ITransactionOptionsExtended,
): (extendedOptions?: ITransactionOptionsExtended) => MethodDecorator {
  const tm = new TransactionManager(extendedOptions);

  /* eslint-disable-next-line @typescript-eslint/no-shadow */
  return function Transactional(options?: ITransactionOptions): MethodDecorator {
    return function TransactionalDecorator(_target: Object, _propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
      const originalMethod = descriptor.value;

      const newDescriptor = descriptor;
      newDescriptor.value = function newMethod(...args: unknown[]) {
        return tm.autoTransaction(() => originalMethod.apply(this, args), { ...options });
      };
      return newDescriptor;
    };
  };
}

export function Transactional(options?: ITransactionOptionsExtended): MethodDecorator {
  return function TransactionalDecorator(_target: Object, _propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;

    const newDescriptor = descriptor;
    newDescriptor.value = async function newMethod(...args: unknown[]) {
      const t = new Transaction(options);
      try {
        const result = await originalMethod.apply(this, args);
        await t.commit();
        return result;
      } catch (err) {
        await t.rollback(err);
      }
    };
    return newDescriptor;
  };
}
