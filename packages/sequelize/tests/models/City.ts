/* eslint-disable import/no-cycle */
import { Table, Column, AllowNull, DataType, BelongsToMany } from 'sequelize-typescript';

import { IOrderingItem } from '../interfaces';
import { BaseEntity, IBaseEntity } from './BaseEntity';
import { Provider, IProviderEntity } from './Provider';

@Table({ tableName: 'Cities' })
export class City extends BaseEntity<ICityEntity> implements ICityEntity {
  @AllowNull(false) @Column(DataType.STRING(128))
  public title: string;

  @AllowNull(false) @Column(DataType.STRING(128))
  public code: string;

  @Column(DataType.STRING(128))
  public contextMockText: string;

  @Column(DataType.INTEGER)
  public order?: number;

  @BelongsToMany(() => Provider, 'ProviderCities', 'cityId', 'providerId')
  public providers?: IProviderEntity[];
}

export interface ICity extends Omit<IOrderingItem, 'id'> {
  title: string;
  code: string;
  contextMockText?: string;
}

export interface ICityWithAssociations extends ICity {
  providers?: number[];
}

export interface ICityEntity extends ICity, IBaseEntity {
  providers?: IProviderEntity[];
}
