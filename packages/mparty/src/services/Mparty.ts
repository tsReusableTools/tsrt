/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Busboy from 'busboy';
import { IncomingMessage } from 'http';

import {
  IAdapterUploadResult, IFileMetadata, IMpartyOptions, IMpartyUploadOptions,
  IAdapter, BusboyOnFileArgs, BusboyOnFieldArgs, IMpartyLimits,
} from '../interfaces';
import { createFileName, getFileExtension, MpartyError, VALIDATION_ERRORS, ERRORS, DEFAULT_OPTIONS } from '../utils';
import { MpartyValidator } from './MpartyValidator';
import { FsAdapter } from '../adapters';

export class Mparty<T extends IFileMetadata> {
  constructor(
    protected readonly options: IMpartyOptions<T> = {},
  ) { this.options = { ...DEFAULT_OPTIONS, ...options }; }

  public async upload<C extends T, Req extends IncomingMessage>(req: Req, options: IMpartyUploadOptions<C> = {}): Promise<IAdapterUploadResult<C>> {
    return new Promise((resolve, reject) => {
      const { headers } = req;
      const { adapter, limits, preservePath, failOnJson, removeUploadedFilesOnError } = this.getValidatedOptions(options);
      if (!failOnJson && headers['content-type'].indexOf('application/json') !== -1) resolve(this.provideJsonResponse(req));

      const busboy = new Busboy({ headers, limits, preservePath });

      // Busboy listenters
      busboy.on('fieldsLimit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.fields(limits.fields), ERRORS.BUSBOY_VALIDATION_ERROR)));
      busboy.on('filesLimit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.files(limits.files), ERRORS.BUSBOY_VALIDATION_ERROR)));
      busboy.on('partsLimit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.parts(limits.parts), ERRORS.BUSBOY_VALIDATION_ERROR)));
      busboy.on('field', (...args: BusboyOnFieldArgs) => this.handleOnField(adapter, [...args], limits));
      busboy.on('file', (...args: BusboyOnFileArgs): void => { this.handleOnFile(adapter, [...args], limits); });
      busboy.on('finish', () => adapter.onFinish());
      busboy.on('error', (error: Error) => adapter.onError(error));

      // Adapter listenters
      adapter.on('finish', async (result: IAdapterUploadResult<C>) => {
        this.unpipeBusboy(req, busboy);
        const error = this.validateRequiredFilesFields(result, limits);
        if (!error) return resolve(result);
        if (removeUploadedFilesOnError) await adapter.onRemoveUploadedFiles(result);
        reject(error);
      });
      adapter.on('error', async (error: Error, result: IAdapterUploadResult<C>) => {
        this.unpipeBusboy(req, busboy);
        if (removeUploadedFilesOnError) await adapter.onRemoveUploadedFiles(result);
        reject(error);
      });

      // Request listenters
      req.on('abort', () => adapter.onError(new MpartyError('Request aborted', ERRORS.REQUEST_ABORTED)));
      req.on('error', (error: Error) => adapter.onError(error));

      req.pipe(busboy);
    });
  }

  protected handleOnField<C extends T>(adapter: IAdapter<C>, [fieldName, value, fieldNameTruncated, valueTruncated]: BusboyOnFieldArgs, limits?: IMpartyLimits): void {
    try {
      if (limits) MpartyValidator.validateField({ fieldName, value, fieldNameTruncated, valueTruncated }, limits);
      adapter.onField(fieldName, value);
    } catch (err) { adapter.onError(err); }
  }

  protected handleOnFile<C extends T>(adapter: IAdapter<C>, [fieldName, file, originalFileName, encoding, mimetype]: BusboyOnFileArgs, limits?: IMpartyLimits): void {
    try {
      if (limits) MpartyValidator.validateFile({ fieldName, originalFileName }, limits);

      const fileName = createFileName(originalFileName);
      const extension = getFileExtension(originalFileName);

      file.on('limit', () => adapter.onError(new MpartyError(VALIDATION_ERRORS.fileSize(limits?.fileSize), ERRORS.BUSBOY_VALIDATION_ERROR)));
      file.on('error', (error: Error) => adapter.onError(error));

      adapter.onFile(file, { fieldName, fileName, originalFileName, encoding, mimetype, extension });
    } catch (err) { adapter.onError(err); }
  }

  protected getValidatedOptions<C extends T>(options: IMpartyUploadOptions<C>): IMpartyUploadOptions<C> {
    const {
      limits = this.options.limits || { },
      preservePath = this.options.preservePath,
      failOnJson = this.options.failOnJson || false,
      removeUploadedFilesOnError = this.options.removeUploadedFilesOnError,
      destination = this.options.destination,
      adapter = this.options.adapter || (destination && new FsAdapter({ destination })) as unknown as IAdapter<C>,
    } = options;
    if (!adapter && !destination) throw new Error('It is necessary to provide adapter or destionation for default FsAdapter!');

    return { adapter, limits, preservePath, failOnJson, destination, removeUploadedFilesOnError };
  }

  protected validateRequiredFilesFields<C extends T>(result: IAdapterUploadResult<C>, limits?: IMpartyLimits): Error {
    if (!limits?.requiredFiles) return;
    const isValid = MpartyValidator.validateRequiredFilesFields(Object.values(result.files), limits.requiredFiles);
    if (!isValid) return new MpartyError(VALIDATION_ERRORS.requiredFiles(limits?.requiredFiles), ERRORS.VALIDATION_ERROR);
  }

  protected provideJsonResponse<C extends T>(req: IncomingMessage): IAdapterUploadResult<C> {
    return {
      fields: typeof req === 'object' && 'body' in req ? (req as any).body : { },
      files: [],
    };
  }

  /* eslint-disable-next-line */
  protected unpipeBusboy(req: IncomingMessage, busboy: any): void {
    req.unpipe(busboy);
    busboy.removeAllListeners();
  }
}
