/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { FindAndCountOptions, Model } from 'sequelize';
import { delay } from '@tsrt/utils';
import {
  BaseRepository, IBaseRepositoryExtendedOptions, ICreateOptions,
  IDeleteOptions, IReadOptions, IRestoreOptions, IUpdateOptions,
} from '../../src';
import { IOrderingItem, IContext } from '../interfaces';
import { defaultContext } from '../utils';

export class CustomBaseRepository<
  I extends GenericObject & IOrderingItem, R = Partial<I>, M extends Model = Model
> extends BaseRepository<I, R, IOrderingItem, M> implements IContext {
  // This properties are necessary ONLY FOR tests.
  public contextMockText: string;
  public onAfterQueryBuiltData: string;
  public onBeforeCreateData: string;
  public onBeforeBulkCreateData: string;
  public onBeforeReadData: string;
  public onBeforeUpdateData: string;
  public onBeforeUpdateItemsOrderData: string;
  public onBeforeInsertAssociationsData: string;
  public onBeforeDeleteData: string;
  public onBeforeRestoreData: string;

  protected async onAfterQueryBuilt(query?: FindAndCountOptions): Promise<FindAndCountOptions> {
    const context = await this.provideContext();
    this.onAfterQueryBuiltData = context.onAfterQueryBuiltData;
    return query;
  }

  protected async onBeforeCreate(body: R, createOptions?: ICreateOptions, through?: GenericObject): Promise<void> {
    await this.insertContext(body, createOptions, 'onBeforeCreateData');
  }

  protected async onBeforeBulkCreate(body: R[], createOptions: ICreateOptions): Promise<void> {
    await this.insertContext(body, createOptions, 'onBeforeBulkCreateData');
  }

  protected async onBeforeRead(readOptions?: IReadOptions, pk?: string | number): Promise<void> {
    const context = await this.provideContext();
    this.onBeforeReadData = context.onBeforeReadData;
  }

  protected async onBeforeUpdate(
    body: Partial<R>, _pk?: number | string, updateOptions?: IUpdateOptions, _through?: GenericObject,
  ): Promise<void> {
    await this.insertContext(body, updateOptions, 'onBeforeUpdateData');
  }

  protected async onBeforeUpdateItemsOrder<C extends Required<IOrderingItem>>(body: C[], readOptions: IReadOptions = { }): Promise<void> {
    await this.insertContext(body, readOptions, 'onBeforeUpdateItemsOrderData');
  }

  protected async onBeforeInsertAssociations(
    _entity: M, _body: Partial<R>, _inserToptions?: IBaseRepositoryExtendedOptions, through?: GenericObject,
  ): Promise<void> {
    await this.insertContext(through, through, 'onBeforeInsertAssociationsData');
  }

  protected async onBeforeDelete(_deleteOptions: IDeleteOptions, _pk?: number | string): Promise<void> {
    const context = await this.provideContext();
    this.onBeforeDeleteData = context.onBeforeDeleteData;
  }

  protected async onBeforeRestore(_restoreOptions: IRestoreOptions): Promise<void> {
    const context = await this.provideContext();
    this.onBeforeRestoreData = context.onBeforeRestoreData;
  }

  protected async insertContext(target: GenericObject | GenericObject[], options: GenericObject, cKey: keyof IContext): Promise<void> {
    const context = await this.provideContext();
    if (!context) return;

    if (cKey) {
      this[cKey] = context[cKey];
      context.contextMockText = context[cKey];
    }
    if (options) options.context = context;
    if (!Array.isArray(target)) Object.keys(context).forEach((key) => { target[key] = (context as GenericObject)[key]; });
    else target.forEach((item) => Object.keys(context).forEach((key) => { item[key] = (context as GenericObject)[key]; }));
  }

  protected async provideContext(): Promise<IContext> {
    // Simulate some async work
    return delay(1, defaultContext);
  }
}
