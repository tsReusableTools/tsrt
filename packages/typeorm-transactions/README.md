
# Typescript Reusable Tools: TypeORM Transactions

[![npm version](https://img.shields.io/npm/v/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE)  [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)  [![Downloads](https://img.shields.io/npm/dm/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)

Convenient transaction and UnitOfWork support for great [TypeORM](https://github.com/typeorm/typeorm).

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.
So prefer using exact version instead of version with `~` or `^`.

## Modern API

Since __v0.8.0__ - this package depends on [cls-hooked](https://www.npmjs.com/package/cls-hooked).
It is heavily inspired by [this package](https://www.npmjs.com/package/typeorm-transactional-cls-hooked).

The main purpose of using new API - ability to abstract from implementation, share transactions easily and have different propagation levels.

#### The most basic example:
```ts
import { Transaction } from  '@tsrt/typeorm-transactions';

async function makeStuffInTransaction(): Promise<any> {
  const transaction =  new Transaction({ ... });

  try {
    await transaction.begin();
    // await transaction.manager.createQueryBuilder()...
    await transaction.commit();
  } catch (err) {
    await transaction.rollback(err);
  }
}
```

### Preconditions
1. CLS namespace should be initialized before transactions usage.
2. Everything should be wrapped into created namespace.
3. Your repositories should (one of):
	- extend __BaseRepository__ from `@tsrt/typeorm-transactions`.
	- extend TypeORM's __Repository__ and before usage `patchTypeOrmRepository` should be called.
	- annotated w/ TypeORM's `EntityRepository` decorator or receive TypeORM's `EntityManager` as first argument in constructor.

### Example

```ts
// rootApplicationFile.ts
import { createTransactionsNamespace, bindTransactionsNamespace, patchTypeOrmRepository, execInTransactionsNamespace } from  '@tsrt/typeorm-transactions';

createTransactionsNamespace(); // This one should be called before any transactions usage
patchTypeOrmRepository(Repository.prototype); // This one only necessary if repositories extends native TypeORM's Repository.


// Example w/ Express
const app =  express();
app.use(bindTransactionsNamespace); // Now all transactions will be bound to this namespace.


// Example in any other place
execInTransactionsNamespace(() => { /* YOUR CODE GOES HERE: SomeService.doStuff()... */ });
  

// SomeRepository.ts
import { BaseRepository } from  '@tsrt/typeorm-transactions';
import { Repository, EntityRepository, EntityManager } from  'typeorm';

// Optionally could be annotated w/ TypeORM's `EntityRepository` decorator.
export class SomeRepository extends BaseRepository { /* ... */ }
// Or
export class SomeRepository extends Repository {
  constructor(public readonly manager: EntityManager) { super(); }
  /* ... */
}


// SomeService.ts
import { getConnection, getManager } from  'typeorm';
import { TransactionManager, Transaction } from  '@tsrt/typeorm-transactions';
import { SomeRepository } from  'path/to/repositories';

export class SomeService {
  public async doStuff(): Promise<void> {
    const repository = new getConnection().getCustomRepository(SomeRepository);
    // const repository = new SomeRepository(getManager());

    const t = new Transaction({ propagation:  'SEPARATE' });
    // Then usage is the same as in `The most basic example` section ...
  }
}
```

### Propagation

- __REQUIRED__ (default) - supports existing transaction if it is or creates new if there is no.
- __SEPARATE__ - creates new transaction even if there is already an existing transaction.
- __SUPPORT__ - supports only existing transaction and does not create new.

### APIs
1. __Transaction__ - constructor to create new single Transaction.
2. __TransactionManager__ constructor to create TransactionManager for specific connection w/ default options. Has 3 methods:
	- __createTransaction__ - creates new single Transaction w/ TransactionManager default options and connection.
	- __transaction__ - creates and starts new single Transaction. Could be provided w/ callback to execute inside transaction and will rollback automatically if no manual commit is called.
	- __autoTransaction__ - same as __transaction__ method, but will commit automatically if no error thrown.


## Legacy API

From version __0.8.0__ it is recommended to use new [Modern API](#modern-api).
Still old API is available for usage under `@tsrt/typeorm-transactions/dist/legacy`.

Most basic usage is same as in [this example](#the-most-basic-example), w/ only one difference - it is not necessary to initialise and use clsNamespace.

Legacy API used separate repositories for each transaction.

For more docs please refer to [legacy docs](https://www.npmjs.com/package/@tsrt/typeorm-transactions/v/0.7.11#usage).

## TODO

  

- [ ] __@Transaction__ decorator for [Modern API](#modern-api).

  

## License

  

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
