import '@tsd/types';

/** Interface for parsed substring for insert function */
export interface ISubstring {
  start?: number;
  length?: number;
  end?: number;
}

/* eslint-disable-next-line */
declare global { namespace Express { interface Request { id?: string; } } }
