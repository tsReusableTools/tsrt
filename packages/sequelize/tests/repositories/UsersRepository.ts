import { BaseRepository } from '../../src';
import { User, IUserEntity } from '../models';

export const UsersRepository = new BaseRepository<IUserEntity>(User);
