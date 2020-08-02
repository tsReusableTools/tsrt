/* eslint-disable import/no-cycle */
import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, AllowNull, Unique, BelongsToMany } from 'sequelize-typescript';

import { IUser, IRole } from '@dal/interfaces';
import { Role, UserRole } from '.';

@Table({ timestamps: true })
export class User extends Model<IUser> implements IUser {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  public id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  public password: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  public name?: string;

  @BelongsToMany(() => Role, { foreignKey: 'userId', otherKey: 'roleId', through: () => UserRole, as: 'roles' })
  public roles?: IRole[];
}
