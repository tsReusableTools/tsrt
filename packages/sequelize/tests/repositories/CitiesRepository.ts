import { BaseRepository } from '../../src';
import { City, ICityEntity, ICity } from '../models';

export const CitiesRepository = new BaseRepository<ICityEntity, ICity>(City);
