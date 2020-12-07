import { BaseRepository } from '../../src';
import { Provider, IProviderEntity, IProvider, IOrderingItem } from '../models';

export const ProvidersRepository = new BaseRepository<IProviderEntity, IProvider, IOrderingItem>(Provider);
