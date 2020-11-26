import Busboy from 'busboy';
import { IncomingMessage } from 'http';
import { extname } from 'path';

import {
  IUploadResult, IFileMetadata, IMpartyOptions, IMpartyUploadOptions,
  IAdapter, BusboyOnFileArgs, BusboyOnFieldArgs,
} from '../interfaces';
import { createFileName, MpartyError, ERRORS, DEFAULT_OPTIONS } from '../utils';
import { MpartyValidator } from './MpartyValidator';
import { FsAdapter } from '../adapters';
import { UploadQueue } from './UploadQueue';

export class Mparty<T extends IFileMetadata> {
  constructor(
    protected readonly options: IMpartyOptions<T> = {},
  ) { this.options = { ...DEFAULT_OPTIONS, ...options }; }

  public async upload<C extends T, Req extends IncomingMessage>(
    req: Req, options: IMpartyUploadOptions<C> = {},
  ): Promise<IUploadResult<C>> {
    const uploadResult: IUploadResult<C> = { fields: {}, files: [] };
    const uploadQueue = new UploadQueue();
    let isParsed = false;

    return new Promise((resolve, reject) => {
      const { headers } = req;
      const { adapter, limits, preservePath, failOnJson, removeOnError } = this.getValidatedOptions(options);
      if (!failOnJson && headers['content-type'].indexOf('application/json') !== -1) return resolve(this.provideJsonResponse(req));

      const busboy = new Busboy({ headers, limits, preservePath });

      function unpipe(): void {
        req.unpipe(busboy);
        req.on('readable', req.read.bind(req));
        busboy.removeAllListeners();
      }

      function onError(errorOrCode: Error | keyof typeof ERRORS): void {
        unpipe();
        uploadQueue.onError(async () => {
          if (removeOnError) await adapter.onRemove(req, uploadResult);
          const error = errorOrCode instanceof Error ? errorOrCode : new MpartyError(errorOrCode, null, limits);
          reject(error);
        });
      }

      function onUploadDone(): void {
        if (!isParsed || !uploadQueue.isDone || uploadQueue.hasError) return;
        unpipe();
        if (uploadResult.files?.length === 1) [uploadResult.file] = uploadResult.files;
        const isValid = MpartyValidator.validateRequiredFilesFields(Object.values(uploadResult.files), limits?.requiredFiles);
        if (!isValid) onError('REQUIRED_FIELDS_ERROR');
        else resolve(uploadResult);
      }

      // Busboy listenters
      busboy.on('fieldsLimit', () => onError('FIELDS_LIMIT_ERROR'));
      busboy.on('filesLimit', () => onError('FILES_LIMIT_ERROR'));
      busboy.on('partsLimit', () => onError('PARTS_LIMIT_ERROR'));

      busboy.on('finish', () => { isParsed = true; onUploadDone(); });
      busboy.on('error', (error: Error) => onError(error));

      busboy.on('field', (...[fieldName, value, fieldNameTruncated, valueTruncated]: BusboyOnFieldArgs) => {
        try {
          if (limits) MpartyValidator.validateField({ fieldName, value, fieldNameTruncated, valueTruncated }, limits);
          uploadResult.fields[fieldName] = value;
        } catch (err) { onError(err); }
      });
      busboy.on('file', async (...[fieldName, file, originalFileName, encoding, mimetype]: BusboyOnFileArgs): Promise<void> => {
        try {
          if (uploadQueue.hasError) { file.resume(); return; }

          uploadQueue.add();

          const fileName = createFileName(originalFileName);
          const extension = extname(originalFileName);

          MpartyValidator.validateFile({ fieldName, originalFileName, extension }, limits);
          file.on('limit', () => onError('FILE_SIZE_ERROR'));
          file.on('error', (error: Error) => onError(error));

          const result = await adapter.onUpload(req, file, { fieldName, fileName, originalFileName, encoding, mimetype, extension });
          uploadResult.files.push(result);

          uploadQueue.remove();
          onUploadDone();
        } catch (err) {
          uploadQueue.remove();
          onError(err);
        }
      });

      // Request listenters
      req.on('abort', () => onError('REQUEST_ABORTED'));
      req.on('error', (error: Error) => onError(error));
      req.pipe(busboy);
    });
  }

  protected getValidatedOptions<C extends T>(options: IMpartyUploadOptions<C>): IMpartyUploadOptions<C> {
    const {
      limits = this.options.limits || { },
      preservePath = this.options.preservePath,
      failOnJson = this.options.failOnJson || false,
      removeOnError = this.options.removeOnError,
      destination = this.options.destination,
      adapter = (this.options.adapter || (destination && new FsAdapter({ destination }))) as unknown as IAdapter<C>,
    } = options;
    if (!adapter && !destination) throw new Error('It is necessary to provide adapter or destionation for default FsAdapter!');

    return { adapter, limits, preservePath, failOnJson, destination, removeOnError };
  }

  protected provideJsonResponse<C extends T, Req extends IncomingMessage>(req: Req): IUploadResult<C> {
    return {
      fields: typeof req === 'object' && 'body' in req ? (req as GenericObject).body : { },
      files: [],
    };
  }
}
