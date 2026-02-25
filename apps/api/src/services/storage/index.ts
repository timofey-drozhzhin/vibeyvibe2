import { getEnv } from "../../env.js";
import { LocalStorageClient } from "./local.js";
import { BunnyStorageClient } from "./bunny.js";

export interface StorageClient {
  upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void>;
  download(path: string): Promise<ArrayBuffer>;
  getPublicUrl(path: string): string;
  exists(path: string): Promise<boolean>;
}

export function createStorageClient(): StorageClient {
  const env = getEnv();

  switch (env.STORAGE_PROVIDER) {
    case "local":
      return new LocalStorageClient(env.STORAGE_LOCAL_PATH);

    case "bunny": {
      if (!env.BUNNY_STORAGE_ZONE) {
        throw new Error("BUNNY_STORAGE_ZONE is required when STORAGE_PROVIDER is 'bunny'");
      }
      if (!env.BUNNY_STORAGE_PASSWORD) {
        throw new Error("BUNNY_STORAGE_PASSWORD is required when STORAGE_PROVIDER is 'bunny'");
      }
      if (!env.BUNNY_CDN_HOSTNAME) {
        throw new Error("BUNNY_CDN_HOSTNAME is required when STORAGE_PROVIDER is 'bunny'");
      }
      return new BunnyStorageClient({
        storageZone: env.BUNNY_STORAGE_ZONE,
        accessKey: env.BUNNY_STORAGE_PASSWORD,
        region: env.BUNNY_STORAGE_REGION,
        cdnHostname: env.BUNNY_CDN_HOSTNAME,
      });
    }

    default:
      throw new Error(`Unknown storage provider: ${env.STORAGE_PROVIDER}`);
  }
}
