/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Busboy from 'busboy';
import { IncomingMessage } from 'http';

import {
  IAdapterUploadResult, IAdapterFileMetadata, IMpartyOptions, IMpartyUploadOptions,
  IAdapter, BusboyOnFileArgs, IMpartyLimits,
} from '../interfaces';
import { createFileName, getFileExtension, ERRORS, MpartyError } from '../utils';
import { MpartyValidator } from './MpartyValidator';

const mpartyValidator = new MpartyValidator();

export class Mparty {
  constructor(
    protected readonly options: IMpartyOptions = {},
  ) { }

  public upload<T extends IAdapterFileMetadata>(req: IncomingMessage, options: IMpartyUploadOptions = {}): Promise<IAdapterUploadResult<T>> {
    return new Promise((resolve, reject) => {
      try {
        const { headers } = req;
        const { limits = this.options.limits, adapter = this.options.adapter } = options;
        console.log('adapter >>>', adapter);
        if (!adapter) throw new Error('It is necessary to provide adapter!');

        const busboy = new Busboy({ headers, limits });

        // Busboy listenters
        busboy.on('fieldsLimit', () => adapter.onError(new MpartyError(ERRORS.fields(limits.fields))));
        busboy.on('filesLimit', () => adapter.onError(new MpartyError(ERRORS.files(limits.files))));
        busboy.on('partsLimit', () => adapter.onError(new MpartyError(ERRORS.parts(limits.parts))));
        busboy.on('field', (fieldName: string, value: any) => adapter.onField(fieldName, value));
        busboy.on('file', (...args: BusboyOnFileArgs): void => { this.handleOnFile(adapter, args, limits); });
        busboy.on('finish', () => adapter.onFinish());

        // Adapter listenters
        adapter.on('finish', (result: IAdapterUploadResult<T>) => {
          this.validateRequiredFilesFields(result, limits);
          resolve(result);
        });
        adapter.on('error', (error: Error) => reject(error));

        // Request listenters
        req.on('abort', () => adapter.onError(new Error('Request aborted')));
        req.on('error', (error: Error) => adapter.onError(error));

        req.pipe(busboy);
      } catch (err) {
        if (err.message === 'Unsupported content type: application/json') resolve(this.getResponseInCaseOfError(req, err));
        else throw err;
      }
    });
  }

  protected handleOnFile(adapter: IAdapter, [fieldName, file, originalFileName, encoding, mimetype]: BusboyOnFileArgs, limits?: IMpartyLimits): void {
    try {
      if (limits) mpartyValidator.validateFile(file, limits);

      const fileName = createFileName(originalFileName);
      const extension = getFileExtension(originalFileName);

      file.on('limit', () => adapter.onError(new MpartyError(ERRORS.fileSize(limits?.fileSize))));
      file.on('error', (error: Error) => adapter.onError(error));
      file.on('data', (data: string) => { adapter.onFileChunk(data, fileName, fieldName, mimetype); });

      adapter.onFile({ file, fieldName, fileName, originalFileName, encoding, mimetype, extension });
    } catch (err) { adapter.onError(err); }
  }

  protected validateRequiredFilesFields<T extends IAdapterFileMetadata>(result: IAdapterUploadResult<T>, limits?: IMpartyLimits): void {
    if (!limits?.requiredFilesFields) return;
    const isValid = mpartyValidator.validateRequiredFilesFields(Object.values(result.files), limits.requiredFilesFields);
    if (!isValid && result.errors) result.errors.push(new MpartyError(ERRORS.requiredFilesFields(limits.requiredFilesFields)));
  }

  protected getResponseInCaseOfError<T extends IAdapterFileMetadata>(req: IncomingMessage, err: Error): IAdapterUploadResult<T> {
    return {
      fields: typeof req === 'object' && 'body' in req ? (req as any).body : { },
      files: [],
      errors: [err],
    };
  }
}
