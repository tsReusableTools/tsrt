import { IMpartyLimits, IFileMetadata, IUploadResult } from '../interfaces';
import { ERRORS, ErrorCodes } from './constants';

function callOrReturn(message: ErrorCodes, limits: IMpartyLimits = { }): string {
  const val = ERRORS[message];
  if (!val) return val as string;
  return typeof val === 'function' ? val(limits) : val;
}
export class MpartyError<T extends IFileMetadata = IFileMetadata> extends Error {
  public message: string;
  public code: string
  public fieldName?: string;
  public uploadedResult?: IUploadResult<T>;

  constructor(code: ErrorCodes, msg?: string, limits: IMpartyLimits = { }, fieldName?: string, uploadedResult?: IUploadResult<T>) {
    const message = msg || callOrReturn(code, limits);
    super(message);
    if (Error.captureStackTrace) Error.captureStackTrace(this, MpartyError);
    this.message = message;
    this.code = code;
    if (fieldName) this.fieldName = fieldName;
    if (uploadedResult) this.uploadedResult = uploadedResult;
  }
}
