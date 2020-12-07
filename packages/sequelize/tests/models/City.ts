/* eslint-disable import/no-cycle */
import { Table, Column, AllowNull, DataType, BelongsToMany } from 'sequelize-typescript';

import { BaseEntity, IBaseEntity } from './BaseEntity';
import { IOrderingItem } from './IOrderingItem';
import { Provider, IProviderEntity } from './Provider';

@Table({ tableName: 'Cities' })
export class City extends BaseEntity<ICityEntity> implements ICityEntity {
  @AllowNull(false) @Column(DataType.STRING(128))
  public title: string;

  @AllowNull(false) @Column(DataType.STRING(128))
  public code: string;

  @Column(DataType.INTEGER)
  public order?: number;

  @BelongsToMany(() => Provider, 'ProviderCities', 'cityId', 'providerId')
  // @BelongsToMany(() => Provider, { through: 'ProviderCities', foreignKey: 'cityId', otherKey: 'providerId', uniqueKey: 'id' })
  public providers?: IProviderEntity[];
}

export interface ICity extends Omit<IOrderingItem, 'id'> {
  title: string;
  code: string;
}

export interface ICityWithAssociations extends ICity {
  providers?: number[];
}

export interface ICityEntity extends ICity, IBaseEntity {
  providers?: IProviderEntity[];
}
