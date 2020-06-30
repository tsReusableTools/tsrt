/* eslint-disable max-classes-per-file */
import stc from 'http-status';

/** Class for Http Error w/ details: status, message, statusText */
export class HttpError extends Error implements IMsg {
  public message: string;
  public data: string;
  public status: number;
  public statusText: string;

  constructor(status = 500, message = (stc as GenericObject)[status] || 'Internal Server Error') {
    super(message);

    this.message = message;
    this.data = message;
    this.status = status;
    this.statusText = (stc as GenericObject)[status];
  }
}

declare global {
  const HttpError: HttpError;
}

/** Hepler for throwing http error, w/ useful alias methods */
export function throwHttpError(status?: number, message?: string): void {
  throw new HttpError(status, message);
}

throwHttpError.badRequest = (message?: string): void => throwHttpError(stc.BAD_REQUEST, message);
throwHttpError.unAuthorized = (message?: string): void => throwHttpError(stc.UNAUTHORIZED, message);
throwHttpError.forbidden = (message?: string): void => throwHttpError(stc.FORBIDDEN, message);
throwHttpError.notFound = (message?: string): void => throwHttpError(stc.NOT_FOUND, message);
throwHttpError.methodNotAllowed = (message?: string): void => throwHttpError(stc.METHOD_NOT_ALLOWED, message);
throwHttpError.conflict = (message?: string): void => throwHttpError(stc.CONFLICT, message);

throwHttpError.internalServerError = (message?: string): void => throwHttpError(stc.INTERNAL_SERVER_ERROR, message);
throwHttpError.notImplemented = (message?: string): void => throwHttpError(stc.NOT_IMPLEMENTED, message);
throwHttpError.badGateway = (message?: string): void => throwHttpError(stc.BAD_GATEWAY, message);
throwHttpError.serviceUnavailable = (message?: string): void => throwHttpError(stc.SERVICE_UNAVAILABLE, message);
throwHttpError.gatewayTimeout = (message?: string): void => throwHttpError(stc.GATEWAY_TIMEOUT, message);
