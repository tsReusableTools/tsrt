# Typescript Reusable Tools: TypeORM Transactions

[![npm version](https://img.shields.io/npm/v/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions) [![Downloads](https://img.shields.io/npm/dm/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)

Convenient transaction and UnitOfWork support for great [TypeORM](https://github.com/typeorm/typeorm).

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.

So prefer using exact version instead of version with `~` or `^`.

## Usage

The most basic example:

```ts
import { Transaction } from '@tsrt/typeorm-transactions';

async function makeStuffInTransaction(): Promise<any> {
  const transaction = new Transaction({ ... });

  try {
    await transaction.begin();
    // await transaction.manager.createQueryBuilder()...
    await transaction.commit();
  } catch (err) {
    await transaction.rollback(err);
  }
}
```

For advanced usage follow next sections:
 - [Transaction](#transaction)
 - [UnitOfWork](#unitofwork)
 - [TransactionManager](#transactionmanager)

## Current API

From version __0.8.0__ it is recommended to use new API.
New API works only w/ [cls-hooked](https://www.npmjs.com/package/cls-hooked).
It is heavely inspired by [this package](https://www.npmjs.com/package/typeorm-transactional-cls-hooked).

__NOTE__: all repositories should (one of):
1. extends __BaseRepository__ from `@tsrt/typeorm-transactions`.
2. extends TypeORM's __Repository__ and before usage `patchTypeOrmRepository` should be called.
3. annotated w/ TypeORM's `EntityRepository` decorator or receive TypeORM's `EntityManager` as first argument in constructor.

```ts
// SomeRepository.ts
import { BaseRepository } from '@tsrt/typeorm-transactions';
import { Repository, EntityRepository, EntityManager } from 'typeorm';

// Optionally could be annotated w/ TypeORM's `EntityRepository` decorator.
export class SomeRepository extends BaseRepository { /* ... */ }

// Or
export class SomeRepository extends Repository {
  constructor(public readonly manager: EntityManager) { super(); }
  /* ... */
}




// rootApplicationFile.ts
import { createTransactionsNamespace, execInTransactionsNamespace, bindTransactionsNamespace, patchTypeOrmRepository, TransactionManager } from '@tsrt/typeorm-transactions';
import { Repository } from 'typeorm';

createTransactionsNamespace(); // This one should be called before any transactions usage
patchTypeOrmRepository(Repository.prototype); // This one only necessary if repositories extends native TypeORM's Repository.


// Example w/ Express
const app = express();
app.use(bindTransactionsNamespace); // Now all transactions will be bound to this namespace.


// SomeService.ts
import { getConnection, getManager } from 'typeorm';
import { TransactionManager, Transaction } from '@tsrt/typeorm-transactions';
import { SomeRepository } from 'path/to/repositories';

export class SomeService {
  public async doStuff(): Promise<void> {
    const repository = new getConnection().getCustomRepository(SomeRepository);
    // const repository = new SomeRepository(getManager());

    const t = new Transaction({ propagation: 'SEPARATE' });
    // Then usage is the same as in `USAGE` section ...
  }
}
```

The main purpose of using new API - ability to abstract from realization, share transactions easily and have different propagation levels.

### Propagation

- __REQUIRED__ (default) - supports existing transaction if it is or creates new if there is no.
- __SEPARATE__ - creates new transaction even if there is already an existing transaction.
- __SUPPORT__ - supports only existing transaction and does not create new.


## Legacy API

From version __0.8.0__ it is recommended to use new API.
Still old API is available for usage under `@tsrt/typeorm-transactions/legacy`.

### Transaction

Transaction constructor. Could be used to create a transaction for any database connection or already existing EntityManager.

Let's imagine we have next Repositories:

```ts
// repositories/index.ts
export * from './UsersRepository';
export * from './UserRolesRepository';
export * from './SomeRepository';
```

```ts
import { Transaction } from '@tsrt/typeorm-transactions';
import * as Repositories from 'path/to/repositores';

class UsersService {
  public async createUser(body: UserCreatePayload): Promise<User> {
    const transaction = new Transaction({ connectionName: 'test', repositories: Repositories });

    try {
      await transaction.begin();
      const user = transaction.repositories.UsersRepository.create(body.user);
      const userRoles = transaction.repositories.UserRolesRepository.create(user.id, body.userRoleIds);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback(); // Here it is also possible to provide optional error|errorMessage to automatically throw error. @example - await transaction.rollback('Error');
      throw new Error(`Some error occured during user creation: ${err.message}`);
    }
  }
}
```

 - It is possible to __chain transactions__ - providing transaction directly:

```ts
import { Transaction } from '@tsrt/typeorm-transactions';
import * as Repositories from 'path/to/repositores';

class UsersService {
  // ...

  public async makeSomeAdditionalStuff(transaction: Transaction<typeof Repositories>): Promise<SomeEntity> {
    const childTransaction = new Transaction({ transaction });

    try {
      await childTransaction.begin(); // This won't work as transaction was already started.
      // ... do some stuff: await childTransaction.manager.createQueryBuilder()...execute();
      await childTransaction.commit(); // This also won't work as transaction could be commited only if it is parent.
    } catch (err) {
      await childTransaction.rollback() // Same as childTransaction.commit();
      // We can throw error here and rollback parent transaction.
    }
  }
}
```

- ... or using [cls-hooked](https://www.npmjs.com/package/cls-hooked).

```ts
import { Transaction } from '@tsrt/typeorm-transactions';
import * as Repositories from 'path/to/repositores';

class UsersService {
  // ...

  public async makeSomeStuff(): Promise<SomeEntity> {
    const transaction = new Transaction({ id: 'testTransaction' }); // This could be specified by default for TransactionManager.

    try {
      await transaction.begin();
      await this.makeSomeAdditionalStuff(); // It will use same transaction due to identiacal `id`.
      await transaction.commit();
    } catch (err) {
      await transaction.rollback(err);
    }
  }

  public async makeSomeAdditionalStuff(): Promise<SomeAnotherEntity> {
    const transaction = new Transaction({ id: 'testTransaction' });

    try {
      await transaction.begin(); // This will work only, if it would be parent - thus called before `makeSomeStuff`.
      // ... do some stuff
      await transaction.commit(); // same.
    } catch (err) {
      await transaction.rollback() // same.
    }
  }
}

```

__NOTE !!!__ In order to use transaction `id`, first of all it is necessary to create namespaces and bind context.

```ts
// src/index.ts
import { createTransactionsNamespace, execInTransactionsNamespace, bindTransactionsNamespace } from '@tsrt/typeorm-transactions';
import { UsersService } from 'path/to/UsersService';

createTransactionsNamespace();

execInTransactionsNamespace(new UsersService().makeSomeStuff());

// or bind to request/response context

import express from 'express';

const app = express();
app.use(bindTransactionsNamespace);

```

- provide entity manager, which was already used:

```ts
import { Transaction } from '@tsrt/typeorm-transactions';
import { getConnection, EntityManager } from 'typeorm';
import * as Repositories from 'path/to/repositores';

class UsersService {
  public async makeSomeStuff(): Promise<void> {
    try {
      await getConnection().transaction(async (manager) => {

      });
    } catch (err) {

    }
  }

  public async makeSomeOtherStuff(manager: EntityManager): Promise<void> {
    const transaction = new Transaction({ manager, repositories: Repositories });
    // ... same behaviour as for any other child transaction;
  }
}
```

__NOTE !!!__ It is very important to call `commit` and `rollback` methods as there could be a `too many clients` error, not releasing connections correctly after transaction is over.
For convenience - use [transaction()](#transactionmanager.transaction).

### UnitOfWork

```ts
import { UnitOfWork } from '@tsrt/typeorm-transactions';
import * as repositories from 'path/to/repositores';

class UsersService {
  public async createUser(body: UserCreatePayload): Promise<User> {
    const unitOfWork = new UnitOfWork({ repositories, connectionName: 'test' });
    try {
      unitOfWork.exec(async ({ manager, repositories }) => {
        // ...
      });
    } catch (err) {
      // ...
    }
  }
}
```


### TransactionManager

TrasnactionManager is a high-level API to manage transactions and unitOfWorks easily.

First let's create TransactionManager instance for our App:

```ts
// src/tm.ts
import { TransactionManager } from '@tsrt/typeorm-transactions';
import * as repositories from 'path/to/repositores';

export const tm = new TransactionManager({ repositories, connectionName: 'test' });
```

##### TransactionManager.createTransaction

Alias for creating a [Transaction](#transaction) using TransactionManager options.


##### TransactionManager.transaction

Alias for creating and immediately invoking `begin` command of  [Transaction](#transaction) using TransactionManager options.

```ts
import { TransactionManager } from '@tsrt/typeorm-transactions';
import { tm } from 'path/to/tm';

class UsersService {
  public async createUser(body: UserCreatePayload): Promise<User> {
    const t = await tm.transaction();

    try {
      // await t.repositories ...
      // await t.manager ...
      await t.commit();
    } catch (err) {
      await t.rollback(err);
    }
  }
}
```

Also could be supplied w/ callback. In this case `rollback` method __will be called automatically, to prevent `max client connections` error__.

```ts
import { TransactionManager } from '@tsrt/typeorm-transactions';
import { tm } from 'path/to/tm';

class UsersService {
  public async createUser(body: UserCreatePayload): Promise<User> {
    return tm.transaction(async (t) => {
      try {
        // await t.repositories ...
        // await t.manager ...
        await t.commit();
      } catch (err) {
        await t.rollback(err);
      }
    });
  }
}
```

##### TransactionManager.unitOfWork

Alias for exec command of [UnitOfWork](#unitofwork) using TransactionManager options.

##### TransactionManager.createUnitOfWork

Alias for creating a [UnitOfWork](#unitofwork) using TransactionManager options.


## TODO

 - [ ] Think on @Transaction and @UnitOfWork decorators.

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
