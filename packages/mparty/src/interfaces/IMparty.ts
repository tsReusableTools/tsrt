import { IAdapter } from './IAdapter';
import { IMpartyLimits } from './IMpartyValidator';

export interface IMpartyOptions {
  adapter?: IAdapter;
  limits?: IMpartyLimits;
}

/* eslint-disable-next-line */
export interface IMpartyUploadOptions extends IMpartyOptions {
  //
}
