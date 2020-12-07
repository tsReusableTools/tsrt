# Typescript Reusable Tools: Sequelize

[![npm version](https://img.shields.io/npm/v/@tsrt/sequelize.svg)](https://www.npmjs.com/package/@tsrt/sequelize) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE) [![Size](https://img.shields.io/bundlephobia/minzip/@tsrt/sequelize.svg)](https://www.npmjs.com/package/@tsrt/sequelize) [![Downloads](https://img.shields.io/npm/dm/@tsrt/sequelize.svg)](https://www.npmjs.com/package/@tsrt/sequelize)

Basic Sequlize Connection Factory and BaseRepository build on top of [sequelize](https://www.npmjs.com/package/sequelize) (v5*).

Could be used (and i'm personally recommend) with [sequelize-typescript](https://www.npmjs.com/package/sequelize-typescript).
## Usage

More examples could be found in [tests](https://github.com/tsReusableTools/tsrt/tree/master/packages/sequelize/tests).

#### Init connection

For example using [sequelize-typescript](https://www.npmjs.com/package/sequelize-typescript) and [PostgreSql](https://www.postgresql.org/):

```ts
import { SequelizeOptions } from 'sequelize-typescript'
import { Database } from '@tsrt/sequelize';

import * as Models from 'path/to/models';

async function bootstrap(): Promise<void> {
  const sequelizeOptions: SequelizeOptions = {
    logging: false,
    dialect: 'postgres',
    database: 'database',
    username: 'username',
    password: 'password',
    host: 'localhost',
    port: 5432,
    models: Database.getModelsList(Models),
  };
  const database1 = await Database.createConnection(Sequelize, sequelizeOptions);
  const database2 = await Database.createConnection(Sequelize, { ... });

  // Close connection:
  // await Database.closeConnection(database1);

  // Use current connection (for example, models):
  // console.log(database1.connection.models);

  // ... start application
}
```

#### Repository usage

##### Example 1
```ts
import { BaseRepository } from '@tsrt/sequelize';

import { SomeModel, ISomeModelEntity } from 'path/to/models';

export const SomeModelRepository = new BaseRepository<ISomeModelEntity>(SomeModel);


// ... later in code

class SomeService {
  public async someMethod(id: number): Promise<ISomeModelEntity> {
    // ... some logic
    const entity = await SomeModelRepository.read({
      skip: 10,
      limit: 100,
      select: ['id', 'title'],
      sort: 'title:asc',
      include: ['nested', 'nested.deeply', { model: OtherModel, as: 'otherModel' }],
      where: {
        $or: {
          id: { $gt: 10 },
          title: { $iLike: '%hello%' },
          'nested.id': 10,
        },
      },
    }, id);
    // ... some logic
  }
}

```

##### Example 2
Imagine usage in express:

```ts
router.get('/entities', async (req, res) => {
  const { skip, limit, sort, select, include, filter } = req.query;
  try {
    const result = await SomeModelRepository.read({ skip, limit, sort, select, include, filter });
    res.status(200).send(result); // { total: number, nextSkip: number, value: [] };
  } catch (err) {
    res.status(err.status).send(err);
  }
});
```

## Available methods

All methods will create its own transaction, execute all queries inside it and commits/rollback at the end.

If method provided w/ transaction manually - it will execute all queries inside it and wiil __NOT__ commit/rollback at the end, it should be done manually by developer when needed.

In such a way it is possible to execute a bunch of different queries inside 1 transaction.

```ts
interface IBaseRepository<
  /** DatabaseEntity interface. Common return type and body type for update/create methods. */
  I extends GenericObject & O,
  
  /**
   *  Entity specific interface without database specific fields like pk, deletedAt.
   *  Common body type for update/create methods.
   *  Here could be defined virtual properties such as associations primaryKeys array.
   *  Could be used to improve TS typechecking and intellisense.
   */
  R = Partial<I>,

  /** Interface for Entity with ordering properties: `primaryKey` and `orderKey`. */
  O extends GenericObject = IOrderingItemDefault,

  /** Repository Model. */
  M extends Model = Model
> {
  /** A reference to Model, provided for BaseRepository constructor. Could be used as native sequelize Active Record pattern. */
  model: Model;

  /**
   *  Creates a transaction or executes a transaction callback.
   *
   *  @param [options] - Transactions options.
   *  @param [cb] - Transaction callback to be executed for managed transactions.
   *
   *  @see https://sequelize.org/master/manual/transactions
   */
  createTransaction<T = I>(optionsOrCb?: TransactionOptions | TransactionCallBack<T>, cb?: TransactionCallBack<T>): Promise<T | Transaction>;

  /**
   *  Creates entity w/ additional ICreateOptions options.
   * 
   *  @param body - Entity data.
   *  @param [customOptions] - Custom options for entity creation.
   *  @param [through] - Data to add into association for Many to Many relations.
   *
   *  Under the hood can create relations if they are define in model definition.
   *  For example if model has a BelongsToMany association w/ model, and association alias is `types`.
   *  Is is possible to provide next body (types array is list of ids):
   *
   *  @example:
   *  create({ name: 'test', types: [1, 2] }, { ... }, { defaultType: 'test' }).
   *  So it will create entity w/ name 'test', created references w/ `types` and inserts { defaultType: 'test' } into those references.
   */
  create(body: Partial<I>, createOptions?: ICreateOptions, through?: GenericObject): Promise<I>;

  /**
   *  Creates multiple entities from provided list (inside transaction).
   *
   *  @param body - List of entities to be created.
   *  @param [createOptions] - Custom options for record creation. Include QueryOptions and CreateOptions.
   *  @param [through] - Data to add into association for Many to Many relations.
   */
  bulkCreate(body: Array<Partial<I>>, createOptions?: ICreateOptions, through?: GenericObject): Promise<I[]>;

  /**
   *  Alias for common read operations. Works for both readOne and readMany.
   *
   *  @param [readOptionsOrPk] - Optional read options or primaryKey.
   *  @param [readOptions] - Reqd options if primaryKey provided as first arument.
   *
   *  If entity has `orderKey` column, will ensure for each request that all entities for similar conditions
   *  have valid `orderKey` (no NULL(s) and duplicates).
   */
  read(readOptionsOrPk: number | string | IReadOptions = { }, readOptions?: IReadOptions): Promise<I | IPagedData<I>>

  /**
   *  Reads one record (by pk or options).
   *
   *  @param readOptionsOrPk - Read options or primaryKey.
   *  @param [readOptions] - Reqd options if primaryKey provided as first arument.
   *
   *  If entity has `orderKey` column, will ensure for each request that all entities for similar conditions
   *  have valid `orderKey` (no NULL(s) and duplicates).
   */
  readOne(readOptionsOrPk: number | string | IReadOptions, pk?: number | string): Promise<I>

  /**
   *  Reads multiple entities and returns paged response.
   *
   *  @param [readOptions] - Optional read options.
   * 
   *  If entity has `orderKey` column, will ensure for each request that all entities for similar conditions
   *  have valid `orderKey` (no NULL(s) and duplicates).
   */
  readMany(readOptions: IReadOptions = { }): Promise<IPagedData<I>>;

  /**
   *  Updates entity.
   *
   *  @param body - Data to be updated.
   *  @param pk - Entity primaryKey or updateOptions.
   *  @param [updateOptions] - Custom options for updating operation or through.
   *  @param [through] - Data to add into association for Many to Many relations.
   *
   *  Creates associations same as `create` method.
   */
  update(body: Partial<I>, pk: number | string | IUpdateOptions, updateOptions?: IUpdateOptions, through?: GenericObject): Promise<I>;

  /**
   *  Updates multiple entities from provided list.
   *
   *  @param body - List of entities to be updated.
   *  @param [updateOptions] - Custom options for updating operation.
   *  @param [through] - Data to add into association for Many to Many relations.
   */
  bulkUpdate(body: Array<Partial<I>>, updateOptions?: IUpdateOptions, through?: GenericObject): Promise<I[]>;

  /**
   *  Update entities order (reordering).
   *
   *  @param body - Items with new orders or array of changes
   *  @param [options] - Additional Query options
   *  @param [checkPermissions=true] - Whether to check permissions or not
   */
  updateItemsOrder<C extends Required<O>>(body: C[], options: IReadOptions = { }): Promise<I[]>;

  /**
   *  Deletes entity by pk.
   *  If `paranoid` mode is enabled - soft deletes. Alternatively deletes entity totally.
   *
   *  @param deleteOptionsOrPk - Entity primaryKey or deleteOptions.
   *  @param [deleteOptions] - Custom options for entity deletion if first argument is primaryKey.
   */
  delete(deleteOptionsOrPk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string>;

  /**
   *  Soft deletes entity by pk (only if `paranoid` mode enabled). Alternatively deletes entity totally.
   *  Alias for delete(pk, { force: false }) or just delete(pk);
   *
   *  @param deleteOptionsOrPk - Entity primaryKey or deleteOptions.
   *  @param [deleteOptions] - Custom options for entity deletion if first argument is primaryKey.
   */
  softDelete(deleteOptionsOrPk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string>;

  /**
   *  Totally deletes entity by pk.
   *  Alias for delete(pk, { force: true });
   *
   *  @param deleteOptionsOrPk - Entity primaryKey or deleteOptions.
   *  @param [deleteOptions] - Custom options for entity deletion if first argument is primaryKey.
   */
  forceDelete(deleteOptionsOrPk: string | number | IDeleteOptions, deleteOptions?: IDeleteOptions): Promise<string>;

  /**
   *  Restores soft deleted entity(-ies).
   *
   *  @param [restoreOptions] - Custom options for restore operation.
   */
  restore(restoreOptions?: IRestoreOptions): Promise<string>;
}
```

## Hooks

Using hooks, it is possible to extend BaseRepository and provide some extra logic/validations/context.
For example here we can provide some __tenant__ specific context in a multi-tenant system.

##### Example: 

```ts
export class CustomRepository<I extends GenericObject, R = Partial<I>, IOrderingItem, M extends Model = Model> extends BaseRepository<I, R, O, M> {
  protected async provideContext(): Promise<IContext> {
    // ...retrieve some context, for example using `express-http-context` package. Or `async_hooks`.
  }

  protected async onAfterQueryBuilt(query?: FindAndCountOptions): Promise<FindAndCountOptions> {
    const context = await this.provideContext();
    // ... altering original `query`;
    return queryWithContext;
  }

  protected async onBeforeCreate(body: R, createOptions?: IBaseRepositoryMethodOptions, through?: GenericObject): Promise<void> {
    const context = await this.provideContext();
    if (!context) return;

    createOptions.context = context;
    Object.keys(context).forEach((key) => { body[key] = context[key]; });
  }

  protected async onBeforeUpdate(
    body: Partial<R>, pk?: number | string, updateOptions?: IUpdateOptions, through?: GenericObject,
  ): Promise<void> {
    const context = await this.provideContext();
    if (!context) return;

    updateOptions.context = context;
    Object.keys(context).forEach((key) => { body[key] = context[key]; });
  }

  protected async onBeforeInsertAssociatedWithEntityDataFromBody(
    _entity: M, _body: I, _options?: IBaseRepositoryExtendedOptions, through?: GenericObject,
  ): Promise<void> {
    const context = await this.provideContext();
    if (!context) return;

    customOptions.context = context;
    Object.keys(context).forEach((key) => { body[key] = context[key]; });
  }

  protected async onBeforeDelete(deleteOptions: IDeleteOptions, pk?: number | string): Promise<void> {
    const context = await this.provideContext();
    if (someCondition) throw new Error('Cannot delete');
  }
}

// ... and then

export const SomeModelRepository = new CustomRepository<ISomeModelInterface>(SomeModel);

// ... or with all types for better typization

export const SomeModelRepository = new CustomRepository<ISomeModelInterface, ICreateInterface, IOrdering, SomeModel>(SomeModel);

// Note, that it is alos possible to set default Ordering type by declaring IBaseOrderingItem for @tsrt/sequelize module.
// Example: declare module '@tsrt/sequelize' { export interface IBaseOrderingItem { pk: number; order?: number; } }

```

##### Hooks

```ts
/**
   *  Hook called after query was built.
   *
   *  @param [parsedQuery] - Previously parsed query params into Sequelize appropriate find and count options.
   *
   *  @note Unlike other hooks should return updated query.
   */
  onAfterQueryBuilt(parsedQuery?: FindAndCountOptions): Promise<FindAndCountOptions> {
    return { ...parsedQuery };
  }

  /**
   *  Hook which invokes directly before create operation.
   *
   *  @param _body - Body for entity creation.
   *  @param [_createOptions] - Custom options for record creation.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  onBeforeCreate(_body: GenericObject, _createOptions?: ICreateOptions, _through?: GenericObject): Promise<void> { }

  /**
   *  Hook which invokes directly before bulk create operation.
   *
   *  @param _body - Body for record creation.
   *  @param [_createOptions] - Custom options for record creation.
   *  @param [_through] - Data to add into association for Many to Many relations.
   */
  onBeforeBulkCreate(_body: GenericObject[], _createOptions?: ICreateOptions, _through?: GenericObject): Promise<void> { }

  /**
   *  Hook which invokes directly before read operations.
   *
   *  @param [_options] - Read options.
   *  @param [_pk] - PrimaryKey.
   */
  onBeforeRead(_options?: IReadOptions, _pk?: string | number | boolean): Promise<void> { }

  /**
   *  Hook which invokes directly before update operation.
   *
   *  @param _body - Body for record creation.
   *  @param _pk - Entity primaryKey or query.
   *  @param [_updateOptions] - Custom options for record update.
   *  @param [_through] - Data to add into association for Many to Many relations.
   *
   *  @note `_pk` arg could be null.
   */
  onBeforeUpdate(
    _body: GenericObject, _pk: number | string, _updateOptions?: IUpdateOptions, _through?: GenericObject,
  ): Promise<void> { }

  /**
   *  Hook which invokes directly before delete operation.
   *
   *  @param [_deleteOptions] - Custom options for record (s) destroy.
   *  @param [_pk] - primaryKey.
   */
  onBeforeDelete(_deleteOptions: IDeleteOptions, _pk?: number | string): Promise<void> { }

  /**
   *  Hook which fires right before adding associated data.
   *
   *  @param _entity - Previously created / updated entity.
   *  @param _body - Data / body to find associated data in.
   *  @param [_insertOptions] - Optional params.
   *  @param [_through] - Data which should be added into associated entities (for Many to Many relations).
   */
  onBeforeInsertAssociatedWithEntityDataFromBody(
    _entity: M, _body: GenericObject, _insertOptions?: IBaseRepositoryExtendedOptions, _through?: GenericObject,
  ): Promise<void> { }
```

## Options

```ts
import { CreateOptions, UpdateOptions, DestroyOptions, RestoreOptions, WhereAttributeHash, IncludeOptions } from 'sequelize';

type GenericObject<T = any> = Record<string, T>;

export interface IPagedData<T> {
  total?: number;
  nextSkip?: number;
  value: T[];
}

/** Database factory config */
export interface IDatabaseConfig {
  /** Whether to sync (Sequelize sync()) after connection established. */
  sync?: boolean;

  /** Whether to log into console connection info after connection established. */
  logConnectionInfo?: boolean;

  /**
   *  Callback, which would be called after connection establised.
   *  Here it is possible, for example, associate Models, if using pure Sequelize (not `sequelize-typescript`).
   *
   *  @param sequelize - Sequelize connection.
   */
  cbAfterConnected?: (sequelize: Sequelize) => Promise<void>;
}

/** Default repository options. */
export interface IBaseRepositoryDefaults {
  /**
   *  Properties, which would ne stripped while update/create operations.
   *  Default: ['createdAt', 'updatedAt', 'deletedAt'].
   */
  restrictedProperties: string[],

  /** Defalt limit param for read operations. Default: 10. */
  limit: number;

  /** Defalt order param for read operations. Default: [primaryKey, 'asc']. */
  order: string[];

  /** Whether to log BaseRepository errors. */
  logError?: boolean;
}

export interface IBaseRepositoryConfig {
  /** Default repository options. */
  defaults: Partial<IBaseRepositoryDefaults>;

  /** Config for OrderingService. */
  orderingServiceConfig: IOrderingServiceConfig;
}

export interface IBaseRepositoryOptions {
  /** Limit for Sql query. Applies for limitation of main entity records. @default: 10. */
  limit?: number | 'none';

  /** Offset for Sql query. @default: 0. */
  skip?: number;

  /**
   *  Applies only in case of reading by pk (`readOne or read` methods) and gives an alias for reading by value if some field.
   *  @default: model primaryKey.
   */
  getBy?: string;

  /** Select attributes from main entity to query for. @example: 'pk, title' or ['pk', 'title'] */
  select?: string | string[];

  /**
   * Sorting conditions. Key:value paires.
   * @example: 'pk:asc,title:desc' or ['pk:asc', 'title:desc'].
   * @default: 'pk:asc'.
   */
  sort?: string | string[];

  /**
   *  Associations for eager loading.
   *
   *  Could a string of aliases, define in model definition (for example if come as queryString from client).
   *  @example: 'nested1, nested2'.
   *
   *  Array of aliases, define in model definition.
   *  @example: ['nested1', 'nested2'].
   *
   *  Also could be nested in both above cases.
   *  @example: ['nested1.deepNested1'].
   *
   *  Or list of full IncludeOptions from Sequelize.
   *  @example: [{ association: 'test' }, { model: SomeModel, as: 'test2', required: false }].
   */
  include?: string | Array<string | IncludeOptions>;

  /**
   *  Filtering (aka `where`) conditions. This one could be shared to get filters from client side.
   *  Will be merged and replaced by conditions from `where` property.
   *
   *  @note - Supports for nested conditions by dot notation.
   *  @note - Supports all Sequelize operators. Operators should be prefixed with `$`.
   *  @see https://sequelize.org/master/manual/model-querying-basics.html#operators
   *
   *  @example:
   *  filter: {
   *    $or: {
   *      id: 1,
   *      title: { $iLike: '%hello%' }
   *      'nested.id': 10,
   *    }
   *  }
   */
  filter?: WhereAttributeHash;

  /**
   *  `Where` conditions. Has priority over `filter` property.
   *
   *  @note - Supports for nested conditions by dot notation.
   *  @note - Supports all Sequelize operators. Operators should be prefixed with `$`.
   *  @see https://sequelize.org/master/manual/model-querying-basics.html#operators
   *
   *  @example:
   *  where: {
   *    $or: {
   *      id: 1,
   *      title: { $iLike: '%hello%' }
   *      'nested.id': 10,
   *    }
   *  }
   */
  where?: WhereAttributeHash;
}

type IBaseRepositoryCroppedOptions = Omit<IBaseRepositoryOptions, 'skip' | 'getBy' | 'select' | 'sort' | 'limit' | 'include'>;

/**
 *  Interface for CRUD controller method options, which influence on adding association data and
 *  response object (whether to create association between tables, or return JOINed result).
 */
export interface IBaseRepositoryExtendedOptions
  extends Transactionable, Omit<IBaseRepositoryOptions, 'skip' | 'getBy' | 'select' | 'sort'> {
  /** Whether it is necessary to associate (create reference) if reference primaryKeys list provided. Default: true */
  associate?: boolean;

  /**
   *  Whether it should replace associatins w/ new reference list (delete and add).
   *
   *  Example for replaceAssociations: true(default):
   *  Model.update({ id: 1, files: [1, 2, 3] }) -> after this query Model will
   *  be associated only w/ files w/ ids [1, 2, 3] even if previously it was associted w/ some others.
   *
   *  Example for replaceAssociations: false:
   *  Model.update({ id: 1, files: [1, 2, 3] }) -> after this query Model will be associted w/ those files
   *  it was associated before + new unique ids (if they were unique in provided list).
   *  So if previously Model was associated with [1, 2, 4] Files, after query it will be: [1, 2, 3, 4].
   */
  replaceAssociations?: boolean;

  /** Whether to return response data, after adding all associations. If false -> return empty response */
  returnData?: boolean;
}

/** Interface for possible options of create method */
export interface ICreateOptions extends IBaseRepositoryExtendedOptions, Omit<Partial<CreateOptions>, 'where' | 'include'> {}

/** Interface for possible options of bulk create method */
export type IBulkCreateOptions = Omit<IUpdateOptions, 'where' | 'limit' | 'filter'>;

/** Interface for possible options of read method */
export interface IReadOptions extends IBaseRepositoryOptions, Omit<Partial<FindAndCountOptions>, 'where' | 'include' | 'limit'> {}

/** Interface for possible options of update method */
export interface IUpdateOptions extends IBaseRepositoryExtendedOptions, Omit<Partial<UpdateOptions>, 'where' | 'limit'> {}

/** Interface for possible options of bulk update method */
export type IBulkUpdateOptions = Omit<IUpdateOptions, 'where' | 'limit' | 'filter'>;

/** Interface for possible options of delete method */
export interface IDeleteOptions extends IBaseRepositoryCroppedOptions, Omit<Partial<DestroyOptions>, 'where'> {}

/** Interface for possible options of restore method */
export interface IRestoreOptions extends IBaseRepositoryCroppedOptions, Omit<Partial<RestoreOptions>, 'where'> {}

/** Type for transaction callback function */
export declare type TransactionCallBack<T> = (t: Transaction) => PromiseLike<T>;

/**
 *  Empty interface for TS augumentation in importing module.
 *
 *  Example: declare module '@tsrt/sequelize' { export interface IBaseOrderingItem { pk: number; order?: number; } }
 */
export interface IBaseOrderingItem { }
```

## License

This project is licensed under the terms of the [MIT license](https://github.com/tsReusableTools/tsrt/blob/master/LICENSE).
