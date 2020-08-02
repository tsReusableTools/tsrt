/* eslint-disable import/no-cycle */
import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement, AllowNull, ForeignKey } from 'sequelize-typescript';

import { IUserRole } from '@dal/interfaces';
import { User } from '../User';
import { Role } from '../Role';

@Table({ timestamps: true })
export class UserRole extends Model<IUserRole> implements IUserRole {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  public id: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.STRING)
  public userId: number;

  @AllowNull(false)
  @ForeignKey(() => Role)
  @Column(DataType.STRING)
  public roleId: number;
}
