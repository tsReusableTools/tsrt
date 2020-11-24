import { ERRORS } from './constants';

export class MpartyError extends Error {
  public message: string;
  public field?: string;

  constructor(message: string, field?: string) {
    super(message);
    if (Error.captureStackTrace) Error.captureStackTrace(this, MpartyError);
    this.message = message;
    if (field) this.field = field;
  }
}

export function throwMpartyError(message: string, field?: string): void {
  throw new MpartyError(message, field);
}

throwMpartyError.fileSize = (size: number, field?: string): void => throwMpartyError(ERRORS.fileSize(size), field);
throwMpartyError.extensions = (extensions: string[], field?: string): void => throwMpartyError(ERRORS.extensions(extensions), field);

// import { ERRORS } from './constants';

// type Errors = typeof ERRORS;
// type ErrorKeys = keyof Errors;

// export class MpartyError extends Error {
//   public message: string;
//   public code: string;
//   public field: string;

//   /* eslint-disable-next-line */
//   // constructor(code: keyof typeof ERRORS, field: string, ...args: any[]) {
//   constructor(code: ErrorKeys, field: string, args: any) {
//     const error = ERRORS[code];
//     const message = typeof error === 'function' ? error(args) : error;
//     super(message);

//     if (Error.captureStackTrace) Error.captureStackTrace(this, MpartyError);

//     this.message = message;
//     this.code = code;
//     this.field = field;
//   }
// }

// const test = new MpartyError('extensions', 'asd', 'asd');
