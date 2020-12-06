import { BaseRepository } from '../../src';
import { City, ICityEntity } from '../models';

export const CitiesRepository = new BaseRepository<ICityEntity>(City);
