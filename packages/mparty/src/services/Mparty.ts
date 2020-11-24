/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Busboy from 'busboy';
import { IncomingMessage } from 'http';

import {
  IAdapterUploadResult, IFileMetadata, IMpartyOptions, IMpartyUploadOptions,
  IAdapter, BusboyOnFileArgs, IMpartyLimits,
} from '../interfaces';
import { createFileName, getFileExtension, VALIDATION_ERRORS, ERROR_CODES, MpartyError } from '../utils';
import { MpartyValidator } from './MpartyValidator';
import { FsAdapter } from '../adapters';

const mpartyValidator = new MpartyValidator();

export class Mparty<T extends IFileMetadata> {
  constructor(
    protected readonly options: IMpartyOptions = {},
  ) { }

  public upload<C extends T>(req: IncomingMessage, options: IMpartyUploadOptions = {}): Promise<IAdapterUploadResult<C>> {
    return new Promise((resolve, reject) => {
      const { headers } = req;
      const { adapter, limits, preservePath, shouldFailOnJson } = this.getValidatedOptions(options);
      if (!shouldFailOnJson && headers['content-type'].indexOf('application/json') !== -1) resolve(this.getResponseInCaseOfError(req));

      const busboy = new Busboy({ headers, limits, preservePath });

      // Busboy listenters
      busboy.on('fieldsLimit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.fields(limits.fields), ERROR_CODES.VALIDATION_ERROR)));
      busboy.on('filesLimit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.files(limits.files), ERROR_CODES.VALIDATION_ERROR)));
      busboy.on('partsLimit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.parts(limits.parts), ERROR_CODES.VALIDATION_ERROR)));
      busboy.on('field', (fieldName: string, value: any, fieldNameTruncated: string, valueTruncated: any) => adapter.onField(fieldName, value));
      busboy.on('file', (...args: BusboyOnFileArgs): void => { this.handleOnFile(adapter, [...args], limits); });
      busboy.on('finish', () => adapter.onFinish());

      // Adapter listenters
      adapter.on('finish', (result: IAdapterUploadResult<C>) => {
        this.unpipeBusboy(req, busboy);
        this.validateRequiredFilesFields(result, limits);
        resolve(result);
      });
      adapter.on('error', (error: Error) => { this.unpipeBusboy(req, busboy); reject(error); });

      // Request listenters
      req.on('abort', () => adapter.onError(new MpartyError('Request aborted', ERROR_CODES.REQUEST_ABORTED)));
      req.on('error', (error: Error) => adapter.onError(error));

      req.pipe(busboy);
    });
  }

  protected handleOnField(adapter: IAdapter): void {
    adapter.onField(fieldName, value);
  }

  protected handleOnFile(adapter: IAdapter, [fieldName, file, originalFileName, encoding, mimetype]: BusboyOnFileArgs, limits?: IMpartyLimits): void {
    try {
      if (limits) mpartyValidator.validateFile(file, limits);

      const fileName = createFileName(originalFileName);
      const extension = getFileExtension(originalFileName);

      file.on('limit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.fileSize(limits?.fileSize), ERROR_CODES.VALIDATION_ERROR)));
      file.on('error', (error: Error) => adapter.onError(error));
      file.on('data', (data: string) => { adapter.onFileChunk(data, fileName, fieldName, mimetype); });

      adapter.onFile(file, { fieldName, fileName, originalFileName, encoding, mimetype, extension });
    } catch (err) { adapter.onError(err); }
  }

  protected getValidatedOptions(options: IMpartyUploadOptions): IMpartyUploadOptions {
    const {
      limits = this.options.limits,
      preservePath = this.options.preservePath,
      shouldFailOnJson = this.options.shouldFailOnJson || false,
      destination = this.options.destination,
      adapter = this.options.adapter || (destination && new FsAdapter({ destination })),
    } = options;
    if (!adapter && !destination) throw new Error('It is necessary to provide adapter or destionation for default FsAdapter!');

    return { adapter, limits, preservePath, shouldFailOnJson, destination };
  }

  protected validateRequiredFilesFields<C extends T>(result: IAdapterUploadResult<C>, limits?: IMpartyLimits): void {
    if (!limits?.requiredFilesFields) return;
    const isValid = mpartyValidator.validateRequiredFilesFields(Object.values(result.files), limits.requiredFilesFields);
    if (!isValid && result.errors) result.errors.push(new MpartyError(VALIDATION_ERRORS.requiredFilesFields(limits.requiredFilesFields), ERROR_CODES.VALIDATION_ERROR));
  }

  protected getResponseInCaseOfError<C extends T>(req: IncomingMessage, err?: Error): IAdapterUploadResult<C> {
    return {
      fields: typeof req === 'object' && 'body' in req ? (req as any).body : { },
      files: [],
      errors: err ? [err] : [],
    };
  }

  /* eslint-disable-next-line */
  protected unpipeBusboy(req: IncomingMessage, busboy: any): void {
    req.unpipe(busboy);
    busboy.removeAllListeners();
  }
}
