export class MpartyError extends Error {
  public message: string;
  public code: string
  public fieldName?: string;

  constructor(message: string, code: string, fieldName?: string) {
    super(message);
    if (Error.captureStackTrace) Error.captureStackTrace(this, MpartyError);
    this.message = message;
    this.code = code;
    if (fieldName) this.fieldName = fieldName;
  }
}

// import { VALIDATION_ERRORS } from './constants';

// type Errors = typeof VALIDATION_ERRORS;
// type ErrorKeys = keyof Errors;

// export class MpartyError extends Error {
//   public message: string;
//   public code: string;
//   public field: string;

//   /* eslint-disable-next-line */
//   // constructor(code: keyof typeof VALIDATION_ERRORS, field: string, ...args: any[]) {
//   constructor(code: ErrorKeys, field: string, args: any) {
//     const error = VALIDATION_ERRORS[code];
//     const message = typeof error === 'function' ? error(args) : error;
//     super(message);

//     if (Error.captureStackTrace) Error.captureStackTrace(this, MpartyError);

//     this.message = message;
//     this.code = code;
//     this.field = field;
//   }
// }

// const test = new MpartyError('extensions', 'asd', 'asd');
