import { IAdapterFileMetadata, IAdapterOptions } from './IAdapter';

export interface IFsAdapterFileMetadata extends IAdapterFileMetadata {
  destination: string;
}

export interface IFsAdapterOptions extends IAdapterOptions {
  destination: string;
}
