/* eslint-disable import/no-cycle */
import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, AllowNull, Unique, BelongsToMany } from 'sequelize-typescript';

import { IPermission, IRole } from '@dal/interfaces';
import { Role, RolePermission } from '.';

@Table({ timestamps: true })
export class Permission extends Model<IPermission> implements IPermission {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  public id: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  public title: string;

  @BelongsToMany(() => Role, { foreignKey: 'permissionId', otherKey: 'roleId', through: () => RolePermission, as: 'roles' })
  public roles?: IRole[];
}
