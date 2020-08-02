import 'reflect-metadata';
import { attachExceptionHandlers, attachSignalHandlers } from '@tsu/utils';
import { bootstrap } from './server';

attachSignalHandlers();
attachExceptionHandlers();
bootstrap();
