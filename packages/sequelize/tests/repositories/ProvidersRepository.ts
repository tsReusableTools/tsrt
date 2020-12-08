import { BaseRepository } from '../../src';
import { Provider, IProviderEntity, IProvider } from '../models';
import { IOrderingItem } from '../interfaces';

export const ProvidersRepository = new BaseRepository<IProviderEntity, IProvider, IOrderingItem>(Provider);
