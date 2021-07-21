
# TsRT: TypeORM Transactions

[![npm version](https://img.shields.io/npm/v/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)  [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE)  [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)  [![Downloads](https://img.shields.io/npm/dm/@tsrt/typeorm-transactions.svg)](https://www.npmjs.com/package/@tsrt/typeorm-transactions)

Convenient transactions support for great [TypeORM](https://github.com/typeorm/typeorm).

## Important

Until version 1.0.0 Api should be considered as unstable and may be changed.
So prefer using exact version instead of version with `~` or `^`.

## Modern API

Since __v0.8.0__ - this package depends on [cls-hooked](https://www.npmjs.com/package/cls-hooked).

__New API__ heavily inspired by [this package](https://www.npmjs.com/package/typeorm-transactional-cls-hooked) but with more _[flexible API](#apis)_.

The main purpose of using new API - ability to abstract from implementation, share transactions easily and have different propagation levels.

### The most basic example:
[Refer to full example for more info](#full-example)
```ts
import { Transaction } from  '@tsrt/typeorm-transactions';

async function makeStuffInTransaction(): Promise<any> {
  const t =  new Transaction({ ... });
  await t.begin();

  try {
    // await transaction.manager.createQueryBuilder()...
    // Or someRepository.create(...)
    await t.commit();
  } catch (err) {
    await t.rollback(err);
  }
}
```


### Preconditions
1. [CLS Namespace should be initialized before transactions usage](#init-cls-namespace).
2. [Everything should be wrapped into created CLS Namespace](#wrap-into-cls-namespace).
3. [Your repositories should (one of)](#repositories):
	  - extend __BaseRepository__ from `@tsrt/typeorm-transactions` (annotated w/ TypeORM's `EntityRepository`).
  	- extend TypeORM's __Repository__ (annotated w/ TypeORM's `EntityRepository`) and before usage `patchTypeOrmRepository` should be called.
    - any class w/ __`manager` (TypeORM's `EntityManager`) property__ and before usage `patchTypeOrmRepository` should be called.
  	- any class w/ TypeORM's `EntityManager` as first argument in constructor and before usage `patchTypeOrmRepository` should be called (or extend __BaseRepository__).


### Init CLS Namespace
```ts
// index.ts
import { createTransactionsNamespace, patchTypeOrmRepository } from '@tsrt/typeorm-transactions';

createTransactionsNamespace(); // This one should be called before any transactions usage
patchTypeOrmRepository(); // This one is only necessary if repositories extends native TypeORM's Repository.
```

### Wrap into CLS Namespace
```ts
import { bindTransactionsNamespace, execInTransactionsNamespace } from '@tsrt/typeorm-transactions';

// Wrap only function:
execInTransactionsNamespace(/* Any async code which uses transactions via CLS from this package */)

// Example for Express:
const app = express();
app.use(bindTransactionsNamespace);

// If using only `Transactional` decorator - no need to init namespace first.
class Service {
  @Transactional()
  public async doStuff(): Promise<any> {
    // do stuff inside transaction
  }
}
```

__!!! Note__, that popular [express-session](https://www.npmjs.com/package/express-session) package can lead to [context loss](https://github.com/othiym23/node-continuation-local-storage/issues/29).
To prevent that try (one of):
1. bind namespace to express _AFTER_ calling `express-session` middleware.
2. call `express-session` middleware and bind `next` function to namespace.

Example:
```ts
import express from 'express';
import expressSession from 'express-session';
import { createTransactionsNamespace, bindTransactionsNamespace } from '@tsrt/typeorm-transactions';;

const ns = createTransactionsNamespace();
const app = express();

// 1. bind namespace to express _AFTER_ calling `express-session` middleware.
app.use(expressSession({ ... }));
app.use(bindTransactionsNamespace);


// 2. call `express-session` middleware and bind `next` function to namespace.
app.use((req, res, next) => expressSession({ ... })(req, res, ns.bind(next)));
```

### Repositories

##### 1. Extending `BaseRepository` from `@tsrt/typeorm-transactions`:
```ts
// repository.ts
import { BaseRepository } from '@tsrt/typeorm-transactions';
import { EntityRepository } from 'typeorm';

EntityRepository(SomeEntity)
export class SomeBaseRepository extends BaseRepository { /* ... */ }


// somewhereElse.ts
import { getConnection } from 'typeorm';
import { SomeBaseRepository } from 'path/to/repository.ts';

getConnection(/* ... */).getCustomRepoistory(SomeBaseRepository).create(/* ... */);
```

##### 2. Extending TypeORM's native `Repository` and patching it w/ `patchTypeOrmRepository`:
```ts
// index.ts
import { patchTypeOrmRepository } from '@tsrt/typeorm-transactions';

patchTypeOrmRepository(); // This on shoud be called somewhere just after `createTransactionsNamespace()`.


// repository.ts
import { Repository, EntityRepository } from 'typeorm';

EntityRepository(SecondEntity)
export class SomeRepository extends Repository { /* ... */ }


// somewhereElse.ts
import { getConnection } from 'typeorm';
import { SomeRepository } from 'path/to/repository.ts';

getConnection(/* ... */).getCustomRepoistory(SomeRepository).create(/* ... */);
```

##### 3. Creating __any__ repository from scratch and call `patchTypeOrmRepository`:
```ts
// repository.ts
import { patchTypeOrmRepository } from '@tsrt/typeorm-transactions';
import { Repository, EntityManager } from 'typeorm';

export class SomeRepository {
  public readonly manager: EntityManager;
  /* ... */
}
patchTypeOrmRepository(SomeRepository, { /* ... connection options ... */ });

// somewhereElse.ts
import { SomeRepository } from 'path/to/repository.ts';

new SomeRepository().create(/* ... */);
```

##### 4. Creating __any__ repository w/ `EntityManager` as first constructor argument:
```ts
import { patchTypeOrmRepository } from '@tsrt/typeorm-transactions';
import { Repository, EntityManager, getManager() } from 'typeorm';

export class SomeRepository {
  constructor(public readonly manager: EntityManager;) {}
  /* ... */
}

// Then
// 1. patchTypeOrmRepository(SomeRepository, { /* ... connection options ... */ });
// 2. Or extend BaseRepository
// 3. Also could be annotated w/ TypeORM's `EntityRepository`.


// somewhereElse.ts
import { SomeRepository } from 'path/to/repository.ts';

new SomeRepository(getManager()).create(/* ... */);
```

### Propagation

- __REQUIRED__ (default) - supports existing transaction if it is or creates new if there is no.
- __SEPARATE__ - creates new transaction even if there is already an existing transaction.
- __SUPPORT__ - supports only existing transaction and does not create new.

### APIs
1. __Transaction__ - constructor to create new single Transaction.
2. __TransactionManager__ - constructor to create TransactionManager for specific connection w/ default options. Has 3 methods:
	- __createTransaction__ - creates new single Transaction w/ TransactionManager default options and connection.
	- __transaction__ - creates and starts new single Transaction. Could be provided w/ callback to execute inside transaction which will _rollback automatically_ if no manual commit is called. _If no callback provided, commit and rollback should be done manually._
	- __autoTransaction__ - same as __transaction__ method (_with callback case_), but will commit automatically if no error thrown.
3. __Transactional__ - method decorator (more convenient/declarative, but less flexible comparing to __TransactionManager__). Has 2 variants:
    - __createTransactional__ - factory function for creating __Transactional__ decorator for specific connection w/ default options. (uses __TransactionManager__ under the hood).
    - __Transactional__ - decorator itself w/ ability to provide any connection and other options.


### Full example


```ts
import { PrimaryGeneratedColumn, Column, Entity, Repository, getConnection, EntityRepository } from 'typeorm';
import { createTransactionsNamespace, bindTransactionsNamespace, patchTypeOrmRepository, TransactionManager } from '@tsrt/typeorm-transactions';

createTransactionsNamespace();
patchTypeOrmRepository();

const tm = new TransactionManager();

const app = express();
app.use(bindTransactionsNamespace);

@Entity('Users')
class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;
}

@EntityRepository(User)
class UsersRepository extends Repository {
  public async createUser(body: IUserPayload): Promise<User> {
    const user = this.manager.create(body);
    return this.manager.save(User, user);
  }
}

class UsersService {
  public async createUsers(users: IUserPayload[]): Promise<User[]> {
    return tm.autoTransaction(async () => {
      const repository = getConnection().getCustomRepository(UsersRepository);
      const promises = users.map((item) => repository.createUser(item));
      return Promise.all(promises);
    });
  }
}

app.use('/test', async (req, res) => {
  const users = await new UsersService().createUsers([
    { name: 'First User' },
    { name: 'Second User' },
  ]);
  res.status(200).send(users);
});

app.listen(3333);
```


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
