/* eslint-disable import/no-cycle */
import { Table, Column, AllowNull, DataType, BelongsToMany } from 'sequelize-typescript';

import { BaseEntity, IBaseEntity } from './BaseEntity';

@Table({ tableName: 'Users' })
export class User extends BaseEntity<IUserEntity> implements IUserEntity {
  @AllowNull(false) @Column(DataType.STRING(128))
  public firstName: string;

  @AllowNull(false) @Column(DataType.STRING(128))
  public lastName: string;

  @AllowNull(false) @Column(DataType.INTEGER)
  public age: number;

  // @BelongsToMany(() => Center, () => FileCenter)
  // public centers?: ICenterEntity[];
}

export interface IUser {
  firstName: string;
  lastName: string;
  age: number;
}

export interface IUserEntity extends IUser, IBaseEntity {
  // centers?: ICenterEntity[];
}
