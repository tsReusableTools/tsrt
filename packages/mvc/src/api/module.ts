import { Module } from '@tsed/di';

@Module({ mount: { '/api/v3': [`${__dirname}/controllers/**/*Controller.ts`] } })
export class BaseServerModule { }

// import 'reflect-metadata';
// import express, { Request, Response } from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import { json, urlencoded } from 'body-parser';
// import { parse } from 'qs';
//
// import {
//   Configuration, Inject, PlatformApplication, ServerLoader, IServerLifecycle, ServerSettings,
// } from '@tsed/common';
// import { Module } from '@tsed/di';
// import { GlobalAcceptMimesMiddleware, PlatformExpress } from '@tsed/platform-express';
// import '@tsed/swagger';
// import '@tsed/ajv';
//
// import { log } from '@tsd/utils';
// import { parseRequest, requestContext } from '@tsd/api';
//
// import './pipes';
// import { NotFoundErrorHandler } from './middlewares';
// import { HealthController, InfoController } from './controllers';
// import { DEFAULT_CONFIG } from '../utils/config';
// import { IApplicationSettings } from '../lib/interfaces';
//
// @Module(DEFAULT_CONFIG)
// export class BaseServerModule extends ServerLoader implements IServerLifecycle {
//   @Inject() public app: PlatformApplication;
//   @Configuration() public settings: IApplicationSettings & Configuration;
//
//   constructor(settings: Partial<IApplicationSettings> = { }) {
//     super(settings);
//     // this.settings.set(settings);
//   }
//
//   public $beforeInit(): void {
//     this.setQueryParser();
//     this.setDefaultCtrls();
//     console.log('this.app >>>', this.app);
//     // console.log('settings >>>', (this.settings as any).map.get('mount'));
//   }
//
//   public $beforeRoutesInit(): void {
//     this.setDefaultMiddlewares();
//     this.setCors();
//     this.setStatics();
//   }
//
//   public $afterRoutesInit(): void {
//     // this.setNotFoundHandler();
//     this.setWebApps();
//   }
//
//   protected setDefaultCtrls(): void {
//     // let { apiBase } = this.settings;
//     // if (!apiBase) apiBase = '';
//     //
//     // const baseCtrls = `${__dirname}/controllers/**/*.ts`;
//     // // const baseCtrls = [HealthController, InfoController];
//     // if (typeof apiBase === 'string') {
//     //   // this.settings.set({ mount: { [apiBase]: baseCtrls } });
//     //   this.addControllers(apiBase, baseCtrls);
//     // } else if (apiBase && Array.isArray(apiBase)) {
//     //   // const mount: GenericObject = { };
//     //   // apiBase.forEach((item) => { mount[item] = baseCtrls; });
//     //   apiBase.forEach((item) => { this.addControllers(item, baseCtrls); });
//     //   // this.settings.set({ mount });
//     // }
//     Object.entries(this.settings.mount).forEach(([key, value]) => { super.addControllers(key, value); });
//
//     // this.mountControllers();
//   }
//
//   protected mountControllers(): void {
//     Object.entries(this.settings.mount).forEach(([key, value]) => {
//       console.log('key >>>', key);
//       console.log('value >>>', value);
//       this.addControllers(key, value);
//     });
//   }
//
//   protected setQueryParser(): void {
//     let options = { strictNullHandling: true, comma: true };
//     if (this.settings.qs) options = { ...options, ...this.settings.qs };
//     this.set('query parser', (str: string) => parse(str, options));
//   }
//
//   protected setDefaultMiddlewares(): void {
//     this
//       // .use(GlobalAcceptMimesMiddleware)
//       .use(json())
//       .use(urlencoded({ extended: true }))
//       .use(helmet())
//       .use(parseRequest)
//       .use(requestContext.attachContext);
//   }
//
//   protected setCors(): void {
//     let options: cors.CorsOptions = { credentials: true, origin: true };
//     if (this.settings.cors) options = { ...options, ...this.settings.cors };
//     this.use(cors(options));
//   }
//
//   protected setStatics(): void {
//     if (!this.settings.statics) return;
//     if (Array.isArray(this.settings.statics)) {
//       this.settings.statics.forEach((item) => this.use(express.static(item)));
//     } else if (typeof this.settings.statics === 'object') {
//       Object.entries(this.settings.statics).forEach(([key, value]) => this.use(express.static(key, value)));
//     }
//   }
//
//   protected setNotFoundHandler(): void {
//     if (!this.settings.webApp) {
//       this.use(NotFoundErrorHandler);
//       return;
//     }
//     if (!this.settings.apiBase) return;
//     if (typeof this.settings.apiBase === 'string') this.use(this.settings.apiBase, NotFoundErrorHandler);
//     else this.settings.apiBase.forEach((item) => this.use(item, NotFoundErrorHandler));
//   }
//
//   protected setWebApps(): void {
//     if (!this.settings.webApp) return;
//
//     if (typeof this.settings.webApp === 'string') this.serveWebApp(this.settings.webApp);
//     else Object.entries(this.settings.webApp).forEach(([key, value]) => this.serveWebApp(value, key));
//   }
//
//   protected serveWebApp(webAppPath: string, endPoint = '*'): void {
//     if (!webAppPath) throw Error('Invalid webApp path provided');
//     const { dir, index } = this.getWebAppMetadata(webAppPath);
//     this.use(express.static(dir));
//     this.use(endPoint, (_req: Request, res: Response) => res.sendFile(index));
//   }
//
//   protected getWebAppMetadata(webAppPath: string): { dir: string; index: string } {
//     if (!webAppPath) throw Error('Invalid webApp path provided');
//     const reg = /index\.(html|php)$/;
//     const dir = webAppPath.replace(reg, '');
//     const index = webAppPath.match(reg) ? webAppPath : `${webAppPath}/index.html`;
//     return { dir, index };
//   }
// }
//
// export async function bootstrap(settings: Partial<Configuration>): Promise<void> {
//   if (!settings.port) throw Error('It is necessary to provide at least `port` settings option');
//
//   try {
//     console.log('bootstrap.settings', { ...DEFAULT_CONFIG, ...settings });
//     const platform = await PlatformExpress.bootstrap(BaseServer, { ...DEFAULT_CONFIG, ...settings });
//     await platform.listen();
//     log.info(`Listen to port: ${settings.port}. Pid: ${process.pid}`);
//   } catch (err) {
//     log.error(err);
//   }
// }
