import { ValidationError } from 'class-validator';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getValidationError(error: ValidationError, inPlace?: string): IValidationError {
  if (!error) return;
  const { property, value, constraints } = error;
  const result: IValidationError = { property, value, in: inPlace, constraints };
  if (!result.in) delete result.in;
  return result;
}

export interface IValidationError {
  property: string;
  value: any;
  constraints: Record<string, string>;
  in?: string;
}
