/* eslint-disable import/no-cycle */
import { Table, Column, AllowNull, DataType, BelongsToMany } from 'sequelize-typescript';

import { BaseEntity, IBaseEntity } from './BaseEntity';
import { City, ICityEntity } from './City';

@Table({ tableName: 'Providers' })
export class Provider extends BaseEntity<IProviderEntity> implements IProviderEntity {
  @AllowNull(false) @Column(DataType.STRING(128))
  public title: string;

  @AllowNull(false) @Column(DataType.STRING(128))
  public phone: string;

  @BelongsToMany(() => City, 'ProviderCities', 'providerId', 'cityId')
  // @BelongsToMany(() => Provider, { through: 'ProviderCities', foreignKey: 'providerId', otherKey: 'cityId', uniqueKey: 'id' })
  public cities?: ICityEntity[];
}

export interface IProvider {
  title: string;
  phone: string;
}

export interface IProviderEntity extends IProvider, IBaseEntity {
  cities?: ICityEntity[];
}
