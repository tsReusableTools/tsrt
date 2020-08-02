import express, { Request, Response } from 'express';
import { Sequelize } from 'sequelize-typescript';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'body-parser';
import { parse } from 'qs';

import { Configuration, Inject, PlatformApplication, ServerLoader, IServerLifecycle } from '@tsed/common';
import { GlobalAcceptMimesMiddleware, PlatformExpress } from '@tsed/platform-express';
import '@tsed/swagger';
import '@tsed/ajv';

import { getObjectValuesList, log } from '@tsu/utils';
import { OrmSequelize } from '@tsu/orm-sequelize';
import { parseRequest, requestContext, SessionService } from '@tsu/api';

import '@api/pipes';
import { PORT, API, STATIC, PSQL, SESSION } from '@utils/config';
import * as Models from '@dal/models';
import { GlobalErrorHandler, NotFoundErrorHandler } from '@api/middlewares';

@Configuration({
  port: PORT,
  rootDir: __dirname,
  mount: { [API]: [`${__dirname}/api/controllers/**/*.ts`] },
  swagger: [{ path: `${API}/api-docs` }],
  logger: { level: 'error' },
  routers: { mergeParams: true },
})
export class Server extends ServerLoader implements IServerLifecycle {
  @Inject()
  public app: PlatformApplication;

  @Configuration()
  public settings: Configuration;

  public $beforeInit(): void {
    this.set('query parser', (str: string) => parse(str, { strictNullHandling: true, comma: true }));
  }

  public $beforeRoutesInit(): void {
    this.app
      .use(GlobalAcceptMimesMiddleware)
      .use(json())
      .use(urlencoded({ extended: true }))
      .use(cors({ credentials: true, origin: true }))
      .use(helmet())
      .use(express.static(STATIC))
      .use(parseRequest)
      .use(requestContext.attachContext)
      .use(SessionService.launch(SESSION));
  }

  public $afterRoutesInit(): void {
    this.app
      .use(API, NotFoundErrorHandler)
      .use('*', (_req: Request, res: Response) => { res.sendFile(`${STATIC}/index.html`); })
      .use(GlobalErrorHandler);
  }
}

export async function bootstrap(): Promise<void> {
  try {
    await OrmSequelize.init(Sequelize, { ...PSQL, models: getObjectValuesList(Models) });

    const platform = await PlatformExpress.bootstrap(Server);
    await platform.listen();
    log.info(`Listen to port: ${PORT}. Pid: ${process.pid}`);
  } catch (err) {
    log.error(err);
  }
}
