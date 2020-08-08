import { ServerLoader } from '@tsed/common';

import { getNotContainingStringsRegExp } from '@tsd/utils';

import { Application } from './application';

export class BaseServer extends ServerLoader {
  private _app: Application;

  constructor() {
    super();
    /* eslint-disable-next-line */
    this._app = new Application({ }, this as any);
    console.log('0 >>>', this._app);
  }

  public $beforeInit(): void {
    console.log('1 >>>', 1);
    this._app.config.setQueryParser();
  }

  public $beforeRoutesInit(): void {
    console.log('2 >>>', 2);
    this._app.config.setDefaultMiddlewares();
    this._app.config.setSendResponseMiddleware((getNotContainingStringsRegExp('/api-docs')));
    this._app.config.setRequestIdMiddleware();
    this._app.config.setStatics();
  }

  public $afterRoutesInit(): void {
    console.log('3 >>>', 3);
    this._app.config.setNotFoundHandler();
    this._app.config.setWebApps();
    this._app.config.setGlobalErrorHandler();
  }
}
