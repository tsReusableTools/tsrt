import { IFileMetadata } from './IAdapter';

export interface IMemoryAdapterFileMetadata extends IFileMetadata {
  buffer: string;
  size: number;
}
