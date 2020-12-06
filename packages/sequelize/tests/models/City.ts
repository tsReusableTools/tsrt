/* eslint-disable import/no-cycle */
import { Table, Column, AllowNull, DataType, BelongsToMany } from 'sequelize-typescript';

import { BaseEntity, IBaseEntity } from './BaseEntity';
import { Provider, IProviderEntity } from './Provider';

@Table({ tableName: 'Cities' })
export class City extends BaseEntity<ICityEntity> implements ICityEntity {
  @AllowNull(false) @Column(DataType.STRING(128))
  public title: string;

  @AllowNull(false) @Column(DataType.STRING(128))
  public code: string;

  @BelongsToMany(() => Provider, 'ProviderCities', 'cityId', 'providerId')
  public providers?: IProviderEntity[];
}

export interface ICity {
  title: string;
  code: string;
  providersPks?: number[];
}

export interface ICityEntity extends ICity, IBaseEntity {
  providers?: IProviderEntity[];
}
