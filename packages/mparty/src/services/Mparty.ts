import Busboy from 'busboy';
import { IncomingMessage } from 'http';
import { extname } from 'path';

// import { parseTypes } from '@tsrt/utils';
import {
  IUploadResult, IFileMetadata, IMpartyOptions, IMpartyUploadOptions,
  IAdapter, BusboyOnFileArgs, BusboyOnFieldArgs, FilesFilter,
} from '../interfaces';
import { createFileName, MpartyError, ERRORS, DEFAULT_OPTIONS } from '../utils';
import { MpartyValidator } from './MpartyValidator';
import { FsAdapter } from '../adapters';
import { UploadQueue } from './UploadQueue';

export class Mparty<T extends IFileMetadata, Req extends IncomingMessage> {
  constructor(
    protected readonly options: IMpartyOptions<T, Req> = {},
  ) { this.options = { ...DEFAULT_OPTIONS, ...options }; }

  public async upload<C extends T, CReq extends Req>(
    req: CReq, options: IMpartyUploadOptions<C, CReq> = {},
  ): Promise<IUploadResult<C>> {
    const uploadResult: IUploadResult<C> = { fields: {}, files: [] };
    const uploadQueue = new UploadQueue();
    let isParsed = false;

    return new Promise((resolve, reject) => {
      const { headers } = req;
      const { adapter, limits, preservePath, failOnJson, removeOnError, filesFilter, fileNameFactory } = this.getValidatedOptions(options);
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
          const error = errorOrCode instanceof Error
            ? errorOrCode
            : new MpartyError(errorOrCode, null, limits, null, !removeOnError && uploadResult);
          reject(error);
        });
      }

      function onUploadDone(): void {
        if (!isParsed || !uploadQueue.isDone || uploadQueue.hasError) return;
        unpipe();
        const isValid = MpartyValidator.validateRequiredFilesFields(Object.values(uploadResult.files), limits?.requiredFiles);
        if (!isValid) onError('REQUIRED_FIELDS_ERROR');
        else resolve(uploadResult);
      }

      // Busboy listenters
      busboy.on('fieldsLimit', () => onError('FIELDS_LIMIT_ERROR'));
      busboy.on('filesLimit', () => onError('FILES_LIMIT_ERROR'));
      busboy.on('partsLimit', () => onError('PARTS_LIMIT_ERROR'));
      busboy.on('error', (error: Error) => onError(error));
      busboy.on('finish', () => { isParsed = true; onUploadDone(); });

      busboy.on('field', (...[fieldName, value, fieldNameTruncated, valueTruncated]: BusboyOnFieldArgs) => {
        try {
          if (limits) MpartyValidator.validateField({ fieldName, value, fieldNameTruncated, valueTruncated }, limits);
          uploadResult.fields[fieldName] = value;
        } catch (err) { onError(err); }
      });

      busboy.on('file', async (...[fieldName, file, originalFileName, encoding, mimetype]: BusboyOnFileArgs): Promise<void> => {
        try {
          if (uploadQueue.hasError) { file.resume(); return; }

          const extension = extname(originalFileName);
          let fileMetadata = { fieldName, originalFileName, encoding, mimetype, extension } as C;

          const fileName = fileNameFactory ? await fileNameFactory(req, file, fileMetadata) : createFileName(originalFileName);
          fileMetadata = { ...fileMetadata, fileName };

          if (filesFilter && !(await filesFilter(req, file, fileMetadata))) { file.resume(); return; }

          uploadQueue.add();

          MpartyValidator.validateFile({ fieldName, originalFileName, extension }, limits);
          file.on('limit', () => onError('FILE_SIZE_ERROR'));
          file.on('error', (error: Error) => onError(error));

          const result = await adapter.onUpload(req, file, fileMetadata);
          uploadResult.files.push(result);
          if (uploadResult.files?.length === 1) [uploadResult.file] = uploadResult.files; else delete uploadResult.file;

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

  protected getValidatedOptions<C extends T, CReq extends Req>(options: IMpartyUploadOptions<C, CReq>): IMpartyUploadOptions<C> {
    const {
      limits = this.options.limits || { },
      preservePath = this.options.preservePath,
      failOnJson = this.options.failOnJson || false,
      removeOnError = this.options.removeOnError,
      destination = this.options.destination,
      filesFilter = this.options.filesFilter as FilesFilter<C, CReq>,
      fileNameFactory = this.options.fileNameFactory,
      adapter = (this.options.adapter || (destination && new FsAdapter({ destination }))) as unknown as IAdapter<C, CReq>,
    } = options;
    if (!adapter && !destination) throw new Error('It is necessary to provide adapter or destionation for default FsAdapter!');

    return { adapter, limits, preservePath, failOnJson, destination, removeOnError, filesFilter, fileNameFactory };
  }

  protected provideJsonResponse<C extends T, CReq extends Req>(req: CReq): IUploadResult<C> {
    return { fields: typeof req === 'object' && 'body' in req ? (req as GenericObject).body : { }, files: [] };
  }
}
