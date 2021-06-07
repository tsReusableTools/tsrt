import { Entity, Column } from 'typeorm';
import { BaseEntity, IBaseEntity } from './BaseEntity';

@Entity('Users')
export class User extends BaseEntity<IUser> implements IUser {
  @Column()
  public firstName: string;

  @Column()
  public lastName: string;

  @Column()
  public age: number;
}

export interface IUserPayload {
  firstName: string;
  lastName: string;
  age: number;
}

export interface IUser extends IBaseEntity, IUserPayload { }
