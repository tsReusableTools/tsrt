/* eslint-disable @typescript-eslint/no-explicit-any */
import stc from 'http-status';

/** Class for Http Error w/ details: status, data, data, statusText */
export class HttpError extends Error implements IMsg {
  public message: string;
  /* eslint-disable-next-line */
  public data: any;
  public status: number;
  public statusText: string;

  constructor(status = 500, data: any = (stc as GenericObject)[status] || 'Internal Server Error') {
    super(data);

    this.message = typeof data === 'string' ? data : (stc as GenericObject)[status];
    this.data = data;
    this.status = status;
    this.statusText = (stc as GenericObject)[status];
  }
}

/** Throws http error, w/ useful alias methods */
export function throwHttpError<T = any>(status?: number, data?: T): void {
  throw new HttpError(status, data);
}

throwHttpError.badRequest = (data?: any): void => throwHttpError(stc.BAD_REQUEST, data);
throwHttpError.unAuthorized = (data?: any): void => throwHttpError(stc.UNAUTHORIZED, data);
throwHttpError.forbidden = (data?: any): void => throwHttpError(stc.FORBIDDEN, data);
throwHttpError.notFound = (data?: any): void => throwHttpError(stc.NOT_FOUND, data);
throwHttpError.methodNotAllowed = (data?: any): void => throwHttpError(stc.METHOD_NOT_ALLOWED, data);
throwHttpError.conflict = (data?: any): void => throwHttpError(stc.CONFLICT, data);

throwHttpError.internalServerError = (data?: any): void => throwHttpError(stc.INTERNAL_SERVER_ERROR, data);
throwHttpError.notImplemented = (data?: any): void => throwHttpError(stc.NOT_IMPLEMENTED, data);
throwHttpError.badGateway = (data?: any): void => throwHttpError(stc.BAD_GATEWAY, data);
throwHttpError.serviceUnavailable = (data?: any): void => throwHttpError(stc.SERVICE_UNAVAILABLE, data);
throwHttpError.gatewayTimeout = (data?: any): void => throwHttpError(stc.GATEWAY_TIMEOUT, data);
