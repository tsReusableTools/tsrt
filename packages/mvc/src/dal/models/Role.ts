/* eslint-disable import/no-cycle */
import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, AllowNull, Unique, BelongsToMany } from 'sequelize-typescript';

import { IRole, IUser, IPermission } from '@dal/interfaces';
import { User, UserRole, Permission, RolePermission } from '.';

@Table({ timestamps: true })
export class Role extends Model<IRole> implements IRole {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  public id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public title: string;

  @BelongsToMany(() => Permission, { foreignKey: 'roleId', otherKey: 'permissionId', through: () => RolePermission, as: 'permissions' })
  public permissions?: IPermission[];

  @BelongsToMany(() => User, { foreignKey: 'roleId', otherKey: 'userId', through: () => UserRole, as: 'users' })
  public users?: IUser[];
}
