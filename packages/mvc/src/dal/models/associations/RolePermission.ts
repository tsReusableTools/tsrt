/* eslint-disable import/no-cycle */
import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, AllowNull, ForeignKey } from 'sequelize-typescript';

import { IRolePermission } from '@dal/interfaces';
import { User, Role } from '..';

@Table({ timestamps: true })
export class RolePermission extends Model<IRolePermission> implements IRolePermission {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  public id: number;

  @AllowNull(false)
  @ForeignKey(() => Role)
  @Column(DataType.STRING)
  public roleId: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.STRING)
  public permissionId: number;
}
