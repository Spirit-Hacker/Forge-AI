export interface StorageService {
  put(key: string, content: Buffer, contentType?: string): Promise<void>;

  get(key: string): Promise<Buffer>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
