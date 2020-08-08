// import { Configuration } from '@tsed/common';
import { CorsOptions } from 'cors';
import { IParseOptions } from 'qs';

export interface IApplicationSettings extends TsED.Configuration {
  webApp?: string | Record<string, string>;
  apiBase?: string | string[];
  cors?: CorsOptions;
  qs?: IParseOptions;
}
