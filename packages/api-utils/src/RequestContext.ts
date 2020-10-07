import { AsyncContext } from './AsyncContext';

/* eslint-disable-next-line @typescript-eslint/no-empty-interface */
export interface IRequestContext {}
// declare global { export interface IRequestContext {} }

export const requestContext = new AsyncContext<IRequestContext>();
