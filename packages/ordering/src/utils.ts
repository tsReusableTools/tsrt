import { IOrderingServiceOptions } from './types';

export const defaultOptions: IOrderingServiceOptions = {
  primaryKey: 'id',
  orderKey: 'order',
  allowOrdersOutOfRange: false,
  clampRange: false,
  insertAfterOnly: false,
  refreshSequence: false,
};
