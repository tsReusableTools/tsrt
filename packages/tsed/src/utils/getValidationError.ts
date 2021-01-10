import { ValidationError } from 'class-validator';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getValidationError(error: ValidationError): IValidationError {
  if (!error) return;
  const { property, value, constraints } = error;
  return { property, value, constraints };
}

export interface IValidationError {
  property: string;
  value: any;
  constraints: Record<string, string>;
}
