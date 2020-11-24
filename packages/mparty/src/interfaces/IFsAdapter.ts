import { IFileMetadata, IAdapterOptions } from './IAdapter';

export interface IFsAdapterFileMetadata extends IFileMetadata {
  destination: string;
  path: string;
  size: number;
}

export interface IFsAdapterOptions extends IAdapterOptions {
  destination: string;
}
