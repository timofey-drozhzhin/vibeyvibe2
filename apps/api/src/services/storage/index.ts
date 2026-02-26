import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getEnv } from "../../env.js";
import { LocalStorageClient } from "./local.js";
import { BunnyStorageClient } from "./bunny.js";

// Resolve API root from the location of this file:
// this file is at apps/api/src/services/storage/index.ts → API root is 3 levels up
const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(__dirname, "../../..");

export interface StorageClient {
  upload(path: string, data: Buffer | ArrayBuffer | ReadableStream, contentType: string): Promise<void>;
  download(path: string): Promise<ArrayBuffer>;
  getPublicUrl(path: string): string;
  exists(path: string): Promise<boolean>;
}

export function createStorageClient(): StorageClient {
  const env = getEnv();

  switch (env.STORAGE_PROVIDER) {
    case "local": {
      // STORAGE_LOCAL_PATH is documented as relative to the API root (apps/api/),
      // so resolve it against the API root directory rather than process.cwd()
      const absolutePath = resolve(API_ROOT, env.STORAGE_LOCAL_PATH);
      return new LocalStorageClient(absolutePath);
    }

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
        region: env.BUNNY_STORAGE_REGION ?? "",
        cdnHostname: env.BUNNY_CDN_HOSTNAME,
      });
    }

    default:
      throw new Error(`Unknown storage provider: ${env.STORAGE_PROVIDER}`);
  }
}
