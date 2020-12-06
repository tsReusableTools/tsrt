import { Table, Column, Model, PrimaryKey, DataType, AutoIncrement } from 'sequelize-typescript';

@Table({ timestamps: true, paranoid: true })
export class BaseEntity<T extends IBaseEntity> extends Model<T> implements IBaseEntity {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  public id: number;
}

export interface IBaseEntity {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
