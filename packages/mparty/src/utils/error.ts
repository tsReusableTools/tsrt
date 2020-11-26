import { IMpartyLimits } from '../interfaces';
import { ERRORS, ErrorCodes } from './constants';

function callOrReturn(message: ErrorCodes, limits: IMpartyLimits = { }): string {
  const val = ERRORS[message];
  if (!val) return val as string;
  return typeof val === 'function' ? val(limits) : val;
}
export class MpartyError extends Error {
  public message: string;
  public code: string
  public fieldName?: string;

  constructor(code: ErrorCodes, msg?: string, limits: IMpartyLimits = { }, fieldName?: string) {
    const message = msg || callOrReturn(code, limits);
    super(message);
    if (Error.captureStackTrace) Error.captureStackTrace(this, MpartyError);
    this.message = message;
    this.code = code;
    if (fieldName) this.fieldName = fieldName;
  }
}
