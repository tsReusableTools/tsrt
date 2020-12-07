/* eslint-disable @typescript-eslint/no-empty-interface */
import {
  CreateOptions, UpdateOptions, DestroyOptions, RestoreOptions, WhereAttributeHash,
  IncludeOptions, FindAndCountOptions, Transaction, Sequelize, Transactionable,
} from 'sequelize';
import { IOrderingServiceConfig } from '@tsrt/utils';

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

  /**
   *  Suffix for relation primaryKeys.
   *  Default: 'Pks'.
   *  Example for `relation` called 'providers' and `relationPksSuffix` = 'Pks':
   *  SomeRepository.create({ title: 'SomeTitle', providersPks: [1, 2, 3] }).
   *
   *  @note relations will be also parsed in { providers: [1, 2, 3] } case.
   *  @note temporary not imlepented - need discussion.
   */
  // relationPksSuffix?: string;
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
   * @default: 'primaryKey:asc'.
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
   *  Whether it should replace associatins w/ new reference list (remove previos and add new).
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
export interface ICreateOptions extends IBaseRepositoryExtendedOptions, Omit<Partial<CreateOptions>, 'where' | 'include' | 'limit'> {}

/** Interface for possible options of bulk create method */
export type IBulkCreateOptions = Omit<ICreateOptions, 'where' | 'limit' | 'filter'>;

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
