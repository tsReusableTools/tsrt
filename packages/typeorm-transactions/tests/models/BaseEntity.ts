import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

import { insertEntityProperties } from '../../src';

export class BaseEntity<T extends IBaseEntity> implements IBaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt?: Date;

  @DeleteDateColumn()
  public deletedAt?: Date;

  constructor(data: T) {
    if (data) insertEntityProperties(this, data);
  }
}

export interface IBaseEntity {
  id: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}
