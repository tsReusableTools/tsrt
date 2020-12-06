/* eslint-disable import/no-cycle */
import { Table, Column, AllowNull, DataType, BelongsToMany } from 'sequelize-typescript';

import { BaseEntity, IBaseEntity } from './BaseEntity';

@Table({ tableName: 'Cities' })
export class City extends BaseEntity<ICityEntity> implements ICityEntity {
  @AllowNull(false) @Column(DataType.STRING(128))
  public title: string;

  @AllowNull(false) @Column(DataType.STRING(128))
  public code: string;

  // @BelongsToMany(() => Center, () => FileCenter)
  // public centers?: ICenterEntity[];
}

export interface ICity {
  title: string;
  code: string;
}

export interface ICityEntity extends ICity, IBaseEntity {
  // centers?: ICenterEntity[];
}
